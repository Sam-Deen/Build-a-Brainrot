import hashlib
import json
import tempfile
import threading
import unittest
from unittest.mock import patch
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import healthcheck


class HealthcheckTests(unittest.TestCase):
    def setUp(self):
        self.files = {"/index.html": b'<div id="root"></div>', "/assets/app.js": b"application bundle",
                      "/videos/test.mp4": b"video bytes"}
        self.responses = dict(self.files)
        responses = self.responses

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                body = responses.get(self.path)
                if body is None:
                    self.send_error(404)
                    return
                self.send_response(206)
                self.send_header("Content-Range", f"bytes 0-{min(63, len(body)-1)}/{len(body)}")
                self.end_headers()
                self.wfile.write(body[:64])

            def log_message(self, *args):
                pass

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.temp = tempfile.TemporaryDirectory()
        self.manifest = Path(self.temp.name) / "manifest.json"
        self.manifest.write_text(json.dumps({name: [{"path": path, "size": len(self.files[path]),
            "prefixHash": hashlib.sha256(self.files[path][:64]).hexdigest()}]
            for name, path in zip(("application", "assets", "bundledVideos"), self.files)}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def measure(self):
        return healthcheck.measure(self.manifest, f"http://127.0.0.1:{self.server.server_port}")

    def test_complete_deployment_is_operational(self):
        report = self.measure()
        self.assertEqual(report["status"], "operational")
        self.assertTrue(report["coreAvailable"])
        self.assertLessEqual(len((json.dumps(report) + "\n").encode()), 4096)

    def test_missing_bundle_breaks_core(self):
        del self.responses["/assets/app.js"]
        report = self.measure()
        self.assertEqual(report["status"], "down")
        self.assertFalse(report["coreAvailable"])
        self.assertEqual(report["components"]["assets"]["reason"], "HTTP 404")

    def test_html_fallback_is_not_a_valid_bundle(self):
        self.responses["/assets/app.js"] = self.files["/index.html"]
        self.assertEqual(self.measure()["status"], "down")

    def test_missing_video_degrades_without_disabling_core(self):
        del self.responses["/videos/test.mp4"]
        report = self.measure()
        self.assertEqual(report["status"], "degraded")
        self.assertTrue(report["coreAvailable"])

    def test_invalid_manifest_is_a_reported_failure(self):
        self.manifest.write_text("{}")
        self.assertEqual(self.measure()["status"], "down")

    def test_unreachable_server_is_reported(self):
        report = healthcheck.measure(self.manifest, "http://127.0.0.1:1")
        self.assertEqual(report["status"], "down")
        self.assertEqual(report["components"]["application"]["reason"], "Connection failed")

    def test_successful_components_have_complete_timestamps(self):
        for component in self.measure()["components"].values():
            self.assertIsNotNone(component["lastAttempt"])
            self.assertIsNotNone(component["lastSuccess"])
            self.assertIsNotNone(component["lastMeasurement"])
            self.assertIsNotNone(component["lastStatusChange"])
            self.assertIsNone(component["lastFailure"])

    @patch("healthcheck.probe", return_value=("operational", None, 10))
    def test_24_idle_hours_keep_components_fresh_with_bounded_probe_counts(self, probe):
        cache = Path(self.temp.name) / "state.json"
        now = datetime(2026, 10, 10, tzinfo=timezone.utc)
        with patch("healthcheck.datetime") as clock:
            clock.fromisoformat.side_effect = datetime.fromisoformat
            for seconds in range(0, 86401, 30):
                clock.now.return_value = now + timedelta(seconds=seconds)
                report = healthcheck.measure(self.manifest, cache_path=cache, env={})
                self.assertEqual(report["status"], "operational")
                for component in report["components"].values():
                    self.assertLessEqual(healthcheck.age(component["lastMeasurement"]), component["intervalMs"])
                    self.assertIsNotNone(component["lastSuccess"])
        # 2881 entry probes, 1441 asset probes, 289 video probes.
        self.assertEqual(probe.call_count, 4611)

    @patch("healthcheck.probe", return_value=("operational", None, 10))
    def test_cached_response_preserves_source_timestamp(self, probe):
        cache = Path(self.temp.name) / "state.json"
        first = healthcheck.measure(self.manifest, cache_path=cache, env={})
        second = healthcheck.measure(self.manifest, cache_path=cache, env={})
        self.assertEqual(first["timestamp"], second["timestamp"])
        self.assertEqual(probe.call_count, 3)

    @patch("healthcheck.probe", return_value=("operational", None, 300))
    def test_slow_success_degrades_and_records_success(self, probe):
        report = healthcheck.measure(self.manifest, env={})
        self.assertEqual(report["status"], "degraded")
        self.assertTrue(report["coreAvailable"])
        self.assertIsNotNone(report["components"]["application"]["lastSuccess"])

    @patch("healthcheck.probe")
    def test_failure_threshold_and_recovery_keep_distinct_timestamps(self, probe):
        cache = Path(self.temp.name) / "state.json"
        now = datetime(2026, 10, 10, tzinfo=timezone.utc)
        env = {"HEALTH_APPLICATION_PROBE_MS": "1000", "HEALTH_ASSETS_PROBE_MS": "1000", "HEALTH_VIDEOS_PROBE_MS": "1000",
               "HEALTH_FAILURE_THRESHOLD": "2", "HEALTH_RECOVERY_THRESHOLD": "2"}
        with patch("healthcheck.datetime") as clock:
            clock.fromisoformat.side_effect = datetime.fromisoformat
            for seconds, outcome, expected in ((0, True, "operational"), (1, False, "degraded"), (2, False, "down"),
                                              (3, True, "degraded"), (4, True, "operational")):
                clock.now.return_value = now + timedelta(seconds=seconds)
                probe.return_value = ("operational", None, 10) if outcome else ("down", "Connection failed", 10)
                report = healthcheck.measure(self.manifest, cache_path=cache, env=env)
                self.assertEqual(report["status"], expected)
            component = report["components"]["application"]
            self.assertEqual(component["lastFailure"], (now + timedelta(seconds=2)).isoformat(timespec="milliseconds"))
            self.assertEqual(component["lastSuccess"], (now + timedelta(seconds=4)).isoformat(timespec="milliseconds"))

    def test_configured_freshness_includes_probe_interval_timeout_and_margin(self):
        config = healthcheck.settings({"HEALTH_ASSETS_STALE_MS": "1000"})
        self.assertGreaterEqual(config["assets"]["staleAfterMs"], 2 * config["assets"]["intervalMs"] + 2 * config["timeout"])

    @patch("healthcheck.probe", return_value=("operational", None, 10))
    def test_manifest_failure_preserves_success_and_accumulates_failures(self, probe):
        cache = Path(self.temp.name) / "state.json"
        env = {"HEALTH_FAILURE_THRESHOLD": "2"}
        first = healthcheck.measure(self.manifest, cache_path=cache, env=env)
        self.manifest.write_text("{}")
        failed = healthcheck.measure(self.manifest, cache_path=cache, env=env)
        self.assertEqual(failed["status"], "degraded")
        self.assertEqual(failed["components"]["application"]["lastSuccess"], first["components"]["application"]["lastSuccess"])
        self.assertIsNotNone(failed["components"]["application"]["lastFailure"])
        self.assertEqual(healthcheck.measure(self.manifest, cache_path=cache, env=env)["status"], "down")


if __name__ == "__main__":
    unittest.main()
