"""Dream Home Designer – local prototype server (standard library only)."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import json
import random
from datetime import datetime, timezone

ROOT = Path(__file__).parent
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)
SAVED = DATA / "saved_designs.json"


def body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    return json.loads(handler.rfile.read(length) or b"{}")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "static"), **kwargs)

    def reply(self, payload, status=200):
        raw = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if urlparse(self.path).path == "/api/designs":
            designs = json.loads(SAVED.read_text()) if SAVED.exists() else []
            return self.reply(designs)
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = body(self)
            if path == "/api/generate":
                seed = random.randint(1000, 9999)
                size = int(payload.get("landSize") or 2400)
                floors = int(payload.get("floors") or 2)
                area = round(size * (0.58 + random.random() * .16))
                cost = area * floors * random.randint(1700, 2300)
                return self.reply({
                    "id": f"DH-{seed}", "seed": seed, "builtUp": area * floors,
                    "cost": cost, "style": payload.get("style", "Modern") + " Residence",
                    "score": random.randint(82, 96), "message": "A fresh concept is ready to explore."
                })
            if path == "/api/save":
                designs = json.loads(SAVED.read_text()) if SAVED.exists() else []
                payload["savedAt"] = datetime.now(timezone.utc).isoformat()
                designs.insert(0, payload)
                SAVED.write_text(json.dumps(designs, indent=2))
                return self.reply({"ok": True, "count": len(designs)})
            return self.reply({"error": "Not found"}, 404)
        except (ValueError, json.JSONDecodeError) as error:
            return self.reply({"error": str(error)}, 400)


if __name__ == "__main__":
    print("Dream Home Designer running at http://localhost:8000")
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
