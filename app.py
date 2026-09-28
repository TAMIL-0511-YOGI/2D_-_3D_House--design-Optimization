"""DreamHome AI deep-learning-oriented local prototype server.

The server keeps the existing standard-library-only runtime so the webpage opens
with `python app.py`. Deep-learning inference is isolated behind `ml.predict`;
today it provides a safe heuristic fallback with the same API shape expected
from a future trained neural layout model.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import json
import random
from datetime import datetime, timezone
from ml.predict import infer_concept_metadata

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

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

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
                prop_type = payload.get("propertyType", "Dream Home")
                model_meta = infer_concept_metadata(payload)
                cycle = int(payload.get("layoutCycle") or 0)

                # Accurate area metric respecting user's land size and floors
                built_up = size * floors if floors > 1 else size
                cost = built_up * random.randint(1800, 2200)

                style_names = {
                    "Dream Home": [
                        "Courtyard Modern Residence",
                        "Open-Concept L-Shaped Villa",
                        "Symmetrical Center-Hall Estate",
                        "Dual-Wing Pavilion Home"
                    ],
                    "Rental Homes": [
                        "Multi-Unit Rental Complex",
                        "Independent Flats Rental Building",
                        "Dual-Flats Income Property",
                        "Multi-Tenant Residential Building"
                    ],
                    "Home + Rental": [
                        "Ground Owner Villa + 1st Floor Rental Flats",
                        "Owner Ground Residence + Upper 2-Unit Rentals",
                        "Dual-Entrance Owner House & Tenant Floor",
                        "Owner Courtyard Home + Independent Upper Units"
                    ]
                }
                styles = style_names.get(prop_type, style_names["Home + Rental"])
                chosen_style = styles[cycle % len(styles)]

                return self.reply({
                    "id": f"DH-{seed}", "seed": seed, "builtUp": built_up,
                    "landSize": size, "floors": floors, "propertyType": prop_type,
                    "cost": cost, "style": chosen_style,
                    "score": model_meta["score"], "message": "A deep-learning layout concept is ready to explore.",
                    "model": model_meta["model"], "modelVersion": model_meta["modelVersion"],
                    "modelStage": model_meta["modelStage"]
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
    print("DreamHome AI running at http://localhost:8000")
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
