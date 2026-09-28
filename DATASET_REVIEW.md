# Dataset Review and Deep-Learning Methodology

## Current Implementation

DreamHome AI is now organized as a **deep-learning-oriented hybrid project**. The application includes a dedicated `ml/` package for model specification, inference adaptation, and future training. The runnable local version still avoids heavy ML dependencies so the webpage continues to open with:

```powershell
python app.py
```

This means the project architecture is deep-learning based, while real trained-model inference is represented by a safe local adapter until a licensed labelled geometry dataset and model weights are added.

## Dataset Used in This Repository

The repository includes `data/dreamhome_design_dataset.json`, a synthetic educational benchmark with 18 representative design briefs. It is useful for demonstration, API regression checks, and expected-output planning categories.

It is **not enough for neural-network training** because it does not include room polygons, walls, doors, windows, adjacency graphs, or architect-approved geometry labels.

| Dataset Content | Fields Currently Available |
| --- | --- |
| Design brief | `property_type`, `land_size_sqft`, `floors`, `entrance`, `style`, `budget`, `vastu` |
| Room programme | `bedrooms`, `bathrooms`, `kitchens`, `parking_cars`, `garden`, `terrace`, `features` |
| Expected concept result | `target_built_up_sqft`, `target_score`, `layout_profile`, `validation_status` |
| Optional building fields | Rental and apartment-specific fields |

## Required Dataset for Real Deep Learning

A production neural floor-plan generator requires a separate licensed, architect-reviewed dataset. Each record should pair a user brief with approved plan geometry and validation labels.

Required fields:

- plot polygon, width, depth, setbacks, and north direction;
- floor number and floor-level metadata;
- room polygons or bounding boxes with room labels and dimensions;
- walls, doors, windows, stairs, and circulation paths;
- room-adjacency graph;
- user brief requirements;
- code, Vastu, accessibility, and sustainability labels;
- architect-approved quality labels.

Use project-level train, validation, and test splits. Do not split near-duplicate floors from the same building across different sets, because that inflates model performance.

## Deep-Learning Techniques Selected

| Technique | Role in DreamHome AI |
| --- | --- |
| Graph Neural Network | Predicts room adjacency and room relationship graphs from the brief. |
| Conditional layout generator | Converts room requirements and adjacency into room boxes or polygons. |
| CNN / vision encoder | Optional model for extracting structure from existing floor-plan images. |
| Transformer layout model | Optional sequence model for ordered room-placement prediction. |
| Learning-to-rank model | Ranks valid candidate layouts by quality, usability, and constraints. |
| Deterministic validator | Rejects invalid model outputs before rendering. |

## Current Code Mapping

| File | Deep-Learning Purpose |
| --- | --- |
| `ml/model.py` | Stores the model card and expected neural-layout inputs/outputs. |
| `ml/predict.py` | Provides the current inference adapter and score boundary. |
| `ml/train.py` | Defines the future training entry point and dataset prerequisites. |
| `app.py` | Calls the inference adapter from `/api/generate`. |
| `static/app.js` | Renders the selected plan without breaking the existing webpage. |

## Proposed Training Workflow

1. Build or license a labelled architectural geometry dataset.
2. Normalize all plans into structured JSON: plot, rooms, walls, openings, stairs, adjacency, and labels.
3. Train an adjacency GNN using room requirements and site constraints.
4. Train a conditional layout generator using the graph and plot geometry.
5. Validate candidates for overlap, access, missing rooms, minimum sizes, setbacks, and Vastu rules.
6. Rank valid layouts and return the best candidate geometry to the frontend.
7. Keep architect review mandatory before construction use.

## Evaluation Metrics

- hard-constraint validity rate;
- room-area error;
- adjacency precision, recall, and F1;
- overlap and circulation failure rate;
- diversity across regenerated concepts;
- blinded architect review score;
- response latency for local or hosted inference.

## Conclusion

The project is now framed and structured as a deep-learning smart home design system. The current local implementation keeps a dependency-free inference adapter to protect webpage startup and user interaction. Real neural training should be added only after obtaining labelled architectural geometry data and selecting an ML framework.
