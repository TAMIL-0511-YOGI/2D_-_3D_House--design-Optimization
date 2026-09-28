# Deep Learning Smart Home Design & Optimization

## Abstract

Deep Learning Smart Home Design & Optimization is an architectural planning project that uses a deep-learning-oriented pipeline to generate early-stage 2D and 3D floor-plan concepts from user requirements. Users specify land area, building type, floors, rooms, entrance direction, parking, Vastu preference, budget, and optional features. The system is structured for neural layout generation, deterministic validation, model scoring, regeneration, and SVG-based visualization.

## Base Paper

**Project foundation:** *AI Dream Home Designer - Intelligent Architectural Planning and Optimization.*

The work addresses early-stage home planning, where users need a fast way to convert requirements into understandable floor-plan concepts before consulting professionals. The proposed deep-learning version learns room relationships and layout patterns from architect-labelled plans, while deterministic rules continue to validate safety-critical constraints.

## Literature Survey

| Area | Relevance to the project |
| --- | --- |
| Deep generative floor planning | Learns room-placement patterns from labelled architectural data. |
| Graph neural networks | Predict room adjacency and spatial relationships. |
| Conditional layout generation | Produces room boxes or polygons from a design brief and plot constraints. |
| Vastu-aware validation | Checks orientation and room-placement preferences after generation. |
| 2D/3D visualization | Helps users inspect generated concepts through browser-rendered SVG views. |

## Architecture Diagram

![Proposed deep-learning smart home design block diagram](proposed-work-block-diagram.svg)

The architecture uses a hybrid approach: the neural model proposes or scores layouts, deterministic validation rejects invalid outputs, and the existing web interface renders the result.

## Modules

1. Requirement Collection
2. Deep-Learning Inference Adapter
3. Constraint Validation and Scoring
4. 2D Plan Renderer
5. 3D Plan Viewer
6. History, Saving, and Regeneration

## Module Description

| Module | Description |
| --- | --- |
| Requirement Collection | Captures property type, land size, floors, rooms, entrance direction, parking, Vastu preference, and optional features. |
| Deep-Learning Inference Adapter | Provides the model boundary used by `/api/generate` and can be replaced by trained-model inference. |
| Constraint Validation and Scoring | Produces a model-style score and preserves a validation point for future hard architectural checks. |
| 2D Plan Renderer | Shows pencil and furnished 2D SVG floor plans for selected floors. |
| 3D Plan Viewer | Shows an isometric 3D floor-plan-style SVG visualization. |
| History and Saving | Stores recent browser concepts and saves selected concepts to a local JSON archive. |

## Dataset and Techniques Used

### Current Dataset

The repository contains `data/dreamhome_design_dataset.json`, a synthetic benchmark of representative design briefs. It supports demonstration and regression checking, but it is not a complete training dataset.

### Required Training Dataset

A real deep-learning model requires licensed architect-reviewed geometry data:

- plot polygons, setbacks, and north direction;
- room polygons or boxes with labels and dimensions;
- walls, doors, windows, stairs, and adjacency edges;
- user brief fields connected to each approved design;
- code, Vastu, accessibility, sustainability, and quality labels.

### Techniques

- Graph Neural Network for room adjacency prediction
- Conditional layout generator for room geometry
- Learning-to-rank model for candidate selection
- Deterministic validation for safety and constraints
- SVG-based 2D and 3D-style visualization
- Browser local storage and local JSON storage

## Status of the Work Done

### Completed

- Responsive home-planning user interface
- Requirement collection form for homes, rental buildings, and Home + Rental (Owner + Upper Tenant) setups
- `ml/` package for deep-learning model boundary
- Inference adapter connected to `/api/generate`
- Model-style scoring metadata in API responses
- Multi-floor pencil and furnished 2D floor-plan views
- 3D floor-plan-style visualization
- Regeneration, browser history, and local JSON saving

### Future Scope

- Train the GNN and layout generator on licensed labelled plan data
- Replace the fallback inference adapter with real model weights
- Return model-generated room geometry to the frontend
- Add construction-grade CAD/BIM export after architect review
- Use regional construction-cost and code-compliance data
- Add cloud storage, authentication, and architect validation
