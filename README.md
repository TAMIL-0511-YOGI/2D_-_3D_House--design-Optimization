# Deep Learning Smart Home Design & Optimization

## Abstract

Deep Learning Smart Home Design & Optimization is a deep-learning-oriented architectural planning project that converts user requirements into optimized 2D and 3D home-layout concepts. Users provide land area, building type, floors, rooms, entrance direction, parking, Vastu preference, budget, and optional features. The application is structured around a future neural layout generator while preserving deterministic validation and browser-based SVG rendering.

The current runnable version uses a lightweight inference adapter in `ml/` so the webpage still opens with only Python installed. A production deep-learning version can replace that adapter with trained PyTorch or TensorFlow inference after a licensed, architect-labelled floor-plan geometry dataset is available.

## Deep-Learning Project Focus

- Neural-layout architecture boundary in `ml/model.py`
- Inference adapter in `ml/predict.py`
- Training entry-point placeholder in `ml/train.py`
- Hybrid pipeline: user brief -> model metadata/score -> validated concept -> SVG plan rendering
- Existing `/api/generate`, `/api/save`, and `/api/designs` endpoints preserved for webpage stability

## SDG Mapping

**SDG 11 - Sustainable Cities and Communities** is the primary Sustainable Development Goal. The project supports early exploration of space-efficient, accessible, and resilient housing concepts. Solar and shared-energy options also connect the project to **SDG 7 - Affordable and Clean Energy**.

## Run Locally

From this folder, run:

```powershell
python app.py
```

Then open `http://localhost:8000` in a browser.

## Current Functionality

- Home, Full Rental, and Home + Rental (Owner Ground Floor + Upper Rentals) project modes
- Land, floors, direction, style, rooms, parking, and feature inputs
- Deep-learning-oriented concept metadata from the local inference adapter
- Neural-style design score returned by `POST /api/generate`
- Pencil, furnished 2D, and 3D floor-plan-style SVG views
- Regeneration, browser history, and local JSON saving

## Important Note

The app is now structured as a deep-learning project, but real neural training is not included because the repository does not contain licensed labelled architectural geometry data or ML framework dependencies. This keeps the webpage opening reliably while making the project ready for a trained model upgrade.
