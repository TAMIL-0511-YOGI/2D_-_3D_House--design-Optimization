# About Project: Deep Learning Smart Home Design & Optimization

## 1. Project Overview

**Deep Learning Smart Home Design & Optimization** is a deep-learning-oriented architectural-planning application for generating early-stage home, full rental, and combined Home + Rental (Owner Ground Floor + Upper Rental Units) layout concepts from a user brief. It collects requirements such as land size, floors, rooms, entrance direction, Vastu preference, budget, parking, and sustainability features, then returns a model-scored concept that the browser visualizes as 2D and 3D SVG floor plans.

The project is intentionally implemented as a hybrid system. Deep learning is responsible for the model boundary, scoring, and future layout-generation pipeline. Deterministic rules and browser rendering remain responsible for safe local execution, clear visualization, and webpage stability.

## 2. User Flow

1. **Welcome screen** - introduces the DreamHome AI experience.
2. **Design brief** - collects the user requirements.
3. **Concept viewer** - shows the generated residence title, built-up area, model score, floor selector, and plan view.
4. **Previous designs** - reopens generated concepts from browser storage.
5. **Save screen** - saves the selected concept to the local JSON library.

## 3. Deep-Learning Architecture

The codebase now separates the model layer from the web layer:

| File | Role |
| --- | --- |
| `app.py` | Serves the webpage and exposes JSON API endpoints. |
| `ml/model.py` | Defines the neural layout model metadata and expected model inputs/outputs. |
| `ml/predict.py` | Provides the inference adapter used by `/api/generate`. |
| `ml/train.py` | Documents the future training entry point and required dataset. |
| `static/app.js` | Keeps the existing SVG floor-plan renderer and page interactions. |

The current inference adapter is dependency-free. It returns deep-learning-style metadata and a quality score without requiring PyTorch, TensorFlow, or trained weights. This is deliberate: the web application must continue opening reliably on a basic Python setup.

## 4. Generation Pipeline

When the user clicks **Create my design**, the browser sends the form payload to `POST /api/generate`.

The backend performs this pipeline:

1. Reads and validates the submitted JSON brief.
2. Sends the brief to the `ml.predict` inference adapter.
3. Receives model metadata and a neural-style layout score.
4. Estimates built-up area and concept cost for display.
5. Returns the same response shape expected by the existing webpage.
6. The frontend renders the selected concept as pencil, furnished 2D, or 3D SVG views.

This preserves the web contract while creating a clean replacement point for a trained neural model.

## 5. Dataset Requirement

A true deep-learning floor-plan generator requires a licensed, architect-reviewed dataset containing:

- plot boundary, dimensions, setbacks, and north direction;
- floor levels and room polygons or bounding boxes;
- walls, doors, windows, stairs, and adjacency edges;
- user brief fields linked to each approved plan;
- Vastu, accessibility, sustainability, and code-compliance labels;
- project-level train, validation, and test splits.

The included `data/dreamhome_design_dataset.json` is a small synthetic benchmark for demonstration and regression checks. It is not sufficient for training a neural layout model because it does not contain geometry labels.

## 6. Technologies Used

| Technology | Purpose |
| --- | --- |
| Python standard library | Local HTTP server and JSON API. |
| `ml/` package | Deep-learning architecture boundary and inference adapter. |
| HTML, CSS, JavaScript | Responsive web interface and browser-side rendering. |
| SVG | Dynamic 2D and 3D-style floor-plan visualization. |
| JSON | Local persistence and benchmark-style data. |

No external package manager is required for the current runnable version.

## 7. API Endpoints

| Endpoint | Method | What it does |
| --- | --- | --- |
| `/api/generate` | POST | Accepts a design brief and returns a model-scored concept. |
| `/api/save` | POST | Saves a concept record to `data/saved_designs.json`. |
| `/api/designs` | GET | Returns saved concept records. |

## 8. Future Deep-Learning Upgrade

The production ML version should:

- train an adjacency model to predict room relationships;
- train a conditional layout generator to produce room boxes or polygons;
- validate every generated layout against hard architectural constraints;
- rank multiple valid candidates using a learned or transparent scoring model;
- return room geometry to the existing frontend renderer.

## 9. Summary

DreamHome AI is now structured as a deep-learning project while keeping the current webpage stable. The present implementation provides the project architecture, API boundary, inference adapter, and documentation needed for a neural layout generator, with real training deferred until a suitable labelled architectural dataset is available.
