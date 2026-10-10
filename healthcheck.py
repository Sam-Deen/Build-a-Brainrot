"""Measure the deployed static application through Nginx without downloading videos."""
import concurrent.futures
import hashlib
import json
import math
import os
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_URL = "http://127.0.0.1:80"
MANIFEST = Path("/app/health-manifest.json")


def probe(resource, base_url, timeout=1.5):
    started = time.monotonic()
    try:
        request = urllib.request.Request(base_url + resource["path"], headers={
            "Range": "bytes=0-63", "Accept-Encoding": "identity",
        })
        with urllib.request.urlopen(request, timeout=timeout) as response:
            prefix = response.read(64)
            size = (response.headers.get("Content-Range", "").rsplit("/", 1)[-1]
                    if response.status == 206 else response.headers.get("Content-Length"))
            if (response.status not in (200, 206) or size != str(resource["size"])
                    or hashlib.sha256(prefix).hexdigest() != resource["prefixHash"]):
                return "down", "Invalid API response", (time.monotonic() - started) * 1000
        return "operational", None, (time.monotonic() - started) * 1000
    except urllib.error.HTTPError as error:
        reason = f"HTTP {error.code}" if 400 <= error.code <= 599 else "Invalid API response"
        error.close()
    except (TimeoutError, socket.timeout):
        reason = "Request timed out"
    except urllib.error.URLError as error:
        reason = "Request timed out" if isinstance(error.reason, (TimeoutError, socket.timeout)) else "Connection failed"
    except (OSError, ValueError, KeyError, TypeError):
        reason = "Operation failed"
    return "down", reason, (time.monotonic() - started) * 1000


def settings(env):
    def number(name, default):
        try:
            value = float(env.get(name, default))
            return value if math.isfinite(value) and 0 < value <= 604800000 else default
        except (TypeError, ValueError):
            return default
    config = {"timeout": number("HEALTH_PROBE_TIMEOUT_MS", 1500),
              "failures": min(1000000, max(1, int(number("HEALTH_FAILURE_THRESHOLD", 1)))),
              "recoveries": min(1000000, max(1, int(number("HEALTH_RECOVERY_THRESHOLD", 1))))}
    for name, prefix, interval, stale, slow in (
        ("application", "APPLICATION", 30000, 90000, 1500),
        ("assets", "ASSETS", 60000, 180000, 1500),
        ("bundledVideos", "VIDEOS", 300000, 900000, 1500),
    ):
        period = min(86400000, max(1000, number(f"HEALTH_{prefix}_PROBE_MS", interval)))
        config[name] = {"intervalMs": period, "staleAfterMs": max(
            number(f"HEALTH_{prefix}_STALE_MS", stale), 2 * period + 2 * config["timeout"] + 5000),
            "slowMs": number(f"HEALTH_{prefix}_SLOW_MS", slow)}
    return config


def stamp():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def age(value):
    return (datetime.now(timezone.utc) - datetime.fromisoformat(value.replace("Z", "+00:00"))).total_seconds() * 1000


def component_result(previous, results, name, config, attempted):
    measured = stamp()
    failed = next((result for result in results if result[0] != "operational"), None)
    latency = round(max(result[2] for result in results), 3)
    failures = min(1000000, previous.get("consecutiveFailures", 0) + 1) if failed else 0
    recoveries = 0 if failed or latency > config[name]["slowMs"] else min(1000000, previous.get("consecutiveRecoveries", 0) + 1)
    status = ("down" if failures >= config["failures"] else "degraded") if failed else (
        "degraded" if latency > config[name]["slowMs"] or previous.get("status") in {"down", "degraded"}
        and recoveries < config["recoveries"] else "operational")
    reason = failed[1] if failed else "Response latency elevated" if latency > config[name]["slowMs"] else "Recovering" if status == "degraded" else None
    return {"status": status, "critical": name != "bundledVideos", "latencyMs": latency, "reason": reason,
            "measurementType": "active", "intervalMs": config[name]["intervalMs"], "staleAfterMs": max(180000, config[name]["staleAfterMs"]),
            "lastAttempt": attempted, "lastMeasurement": measured,
            "lastSuccess": previous.get("lastSuccess") if failed else measured,
            "lastFailure": measured if failed else previous.get("lastFailure"),
            "lastStatusChange": measured if previous.get("status") != status else previous.get("lastStatusChange"),
            "consecutiveFailures": failures, "consecutiveRecoveries": recoveries}


def measure(manifest_path=MANIFEST, base_url=BASE_URL, cache_path=None, env=None):
    config = settings(os.environ if env is None else env)
    components = {}
    try:
        if cache_path and Path(cache_path).exists():
            try:
                components = json.loads(Path(cache_path).read_text())["components"]
            except (OSError, ValueError, KeyError, TypeError):
                components = {}
        manifest = json.loads(Path(manifest_path).read_text())
        if not all(isinstance(manifest.get(name), list) and manifest[name]
                   for name in ("application", "assets", "bundledVideos")):
            raise ValueError("Incomplete manifest")
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            attempted = stamp()
            pending = {name: [pool.submit(probe, resource, base_url, config["timeout"] / 1000) for resource in manifest[name]]
                       for name in ("application", "assets", "bundledVideos")
                       if name not in components or age(components[name]["lastAttempt"]) < 0
                       or age(components[name]["lastAttempt"]) >= config[name]["intervalMs"]}
            for name, futures in pending.items():
                results = [future.result() for future in futures]
                components[name] = component_result(components.get(name, {}), results, name, config, attempted)
    except (OSError, ValueError, KeyError, TypeError):
        previous = components.get("application", {})
        components = {"application": component_result(previous, [("down", "Operation failed", 0)], "application", config, stamp())}
    for name, component in components.items():
        if not -5000 <= age(component["lastMeasurement"]) <= config[name]["staleAfterMs"]:
            if component["status"] != "unknown":
                component["lastStatusChange"] = stamp()
            component.update(status="unknown", reason="Monitoring result stale")
    critical = [c for c in components.values() if c["critical"]]
    core = False if any(c["status"] == "down" for c in critical) else None if any(c["status"] == "unknown" for c in critical) else True
    report = {
        "contract": "application-health/v1",
        "status": "down" if core is False else "unknown" if core is None or any(c["status"] == "unknown" for c in components.values()) else "degraded" if any(c["status"] != "operational" for c in components.values()) else "operational",
        "coreAvailable": core,
        "timestamp": max(c["lastMeasurement"] for c in components.values()),
        "validForMs": 180000,
        "components": components,
    }
    if cache_path:
        try:
            temporary = Path(str(cache_path) + ".tmp")
            temporary.write_text(json.dumps(report, separators=(",", ":")))
            temporary.replace(cache_path)
        except OSError:
            pass  # Measurements remain valid even if persistence is unavailable.
    return report


if __name__ == "__main__":
    # tmpfs retains counters between Docker invocations without disk writes.
    cache = os.environ.get("HEALTH_STATE_PATH", "/dev/shm/brainrot-health.json")
    try:
        import fcntl
        with open(cache + ".lock", "w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            report = measure(cache_path=cache)
    except (ImportError, OSError):
        report = measure()
    print(json.dumps(report, separators=(",", ":")), flush=True)
    sys.exit(0 if report["status"] in {"operational", "degraded"} and report["coreAvailable"] is True else 1)
