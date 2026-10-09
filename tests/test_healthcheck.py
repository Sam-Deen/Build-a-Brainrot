import hashlib
import json
import tempfile
import threading
import unittest
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


if __name__ == "__main__":
    unittest.main()
