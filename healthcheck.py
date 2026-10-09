"""Measure the deployed static application through Nginx without downloading videos."""
import concurrent.futures
import hashlib
import json
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_URL = "http://127.0.0.1:80"
MANIFEST = Path("/app/health-manifest.json")


def probe(resource, base_url):
    started = time.monotonic()
    try:
        request = urllib.request.Request(base_url + resource["path"], headers={
            "Range": "bytes=0-63", "Accept-Encoding": "identity",
        })
        with urllib.request.urlopen(request, timeout=1.5) as response:
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


def measure(manifest_path=MANIFEST, base_url=BASE_URL):
    components = {}
    try:
        manifest = json.loads(Path(manifest_path).read_text())
        if not all(isinstance(manifest.get(name), list) and manifest[name]
                   for name in ("application", "assets", "bundledVideos")):
            raise ValueError("Incomplete manifest")
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            pending = {name: [pool.submit(probe, resource, base_url) for resource in manifest[name]]
                       for name in ("application", "assets", "bundledVideos")}
            for name, futures in pending.items():
                results = [future.result() for future in futures]
                failed = next((result for result in results if result[0] != "operational"), None)
                components[name] = {
                    "status": "down" if failed else "operational",
                    "critical": name != "bundledVideos",
                    "latencyMs": round(max(result[2] for result in results), 3),
                    "reason": failed[1] if failed else None,
                }
    except (OSError, ValueError, KeyError, TypeError):
        components = {"application": {"status": "down", "critical": True, "reason": "Operation failed"}}
    core = all(component["status"] == "operational" for component in components.values() if component["critical"])
    return {
        "contract": "application-health/v1",
        "status": "down" if not core else "degraded" if any(c["status"] != "operational" for c in components.values()) else "operational",
        "coreAvailable": core,
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "validForMs": 90000,
        "components": components,
    }


if __name__ == "__main__":
    report = measure()
    print(json.dumps(report, separators=(",", ":")), flush=True)
    sys.exit(0 if report["coreAvailable"] else 1)
