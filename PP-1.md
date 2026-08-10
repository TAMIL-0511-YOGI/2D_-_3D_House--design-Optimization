# AI-Powered Smart Home Design & Optimization

## Abstract

AI-Powered Smart Home Design & Optimization is an intelligent architectural planning platform that generates professional 2D and 3D floor-plan concepts from user requirements. Users can specify land area, building type, floors, rooms, entrance direction, parking, and Vastu preferences. The system applies architectural planning rules and AI-inspired optimization to produce dimensioned layout sketches, furnished 2D floor-plan views, and 3D floor-plan-style visualizations. It also supports regeneration of alternative layouts while retaining the same requirements. The platform simplifies early home planning, reduces initial design effort and cost, and helps users visualize personalized building concepts before construction.

## Base Paper

**Project foundation:** *AI Dream Home Designer — Intelligent Architectural Planning and Optimization.*

The project addresses the difficulty of early-stage home planning, where users may find professional design services costly and struggle to visualize a plan before construction. The proposed approach captures user requirements, applies planning constraints, and generates alternative visual floor-plan concepts.

> Add the institution-approved author names, paper title, journal/conference, and publication year here if a specific base paper is prescribed.

## Literature Survey

| Area | Relevance to the project |
| --- | --- |
| Computer-aided floor planning | Uses room adjacency, circulation, zoning, and area-allocation principles for preliminary plan generation. |
| Generative design | Uses constraints and variation to produce multiple layouts from the same user brief. |
| Vastu-aware planning | Represents orientation and room-placement preferences as planning inputs. |
| 3D visualization | Helps non-technical users understand the planned space through an isometric 3D-style view. |

## Architecture Diagram

```text
User
  │ Requirements: land, rooms, floors, direction, parking, Vastu, features
  ▼
Web User Interface (HTML, CSS, JavaScript)
  ▼
Python API (Generate and Save endpoints)
  ▼
Design Engine
  ├─ Rule-based zoning and layout selection
  ├─ Seeded procedural variation for regeneration
  └─ Concept metrics generation
  ▼
Output
  ├─ Dimensioned pencil floor plan
  ├─ Furnished 2D floor plan
  ├─ Isometric 3D floor-plan-style view
  └─ Saved JSON design record
```

Recent concepts are retained in browser local storage, while saved concepts are stored in a local JSON file on the server.

## Modules

1. Requirement Collection
2. Concept Generation
3. 2D Plan Renderer
4. 3D Plan Viewer
5. History and Saving
6. Regeneration

## Module Description

| Module | Description |
| --- | --- |
| Requirement Collection | Captures property type, land size, floors, rooms, entrance direction, parking, Vastu preference, and optional features. |
| Concept Generation | Creates estimated concept information and a unique layout variation from the submitted brief. |
| 2D Plan Renderer | Shows pencil and furnished 2D SVG floor plans for selected floors. |
| 3D Plan Viewer | Shows an isometric 3D floor-plan-style SVG visualization of the selected layout. |
| History and Saving | Stores recent browser concepts and saves selected concepts to a local JSON archive. |
| Regeneration | Produces alternative layout variations while preserving the user's core requirements. |

## Dataset and Techniques Used

### Dataset / Inputs

The current prototype does not use an external training dataset. Its input data is supplied directly by the user:

- Land area and building type
- Number of floors, bedrooms, bathrooms, kitchens, and parking requirements
- Entrance direction and Vastu preference
- Optional rooms, accessibility features, solar options, and free-text ideas

### Techniques

- Rule-based architectural zoning
- Constraint-oriented layout selection
- Seeded procedural variation for regeneration
- SVG-based dimensioned 2D floor-plan rendering
- Isometric SVG 3D floor-plan visualization
- Browser local storage and local JSON storage

## Status of the Work Done

### Completed

- Responsive home-planning user interface
- Requirement collection form for homes, rental buildings, and apartments
- Concept generation with plan variations
- Multi-floor pencil and furnished 2D floor-plan views
- 3D floor-plan-style visualization
- Regeneration, browser history, and local JSON saving

### Future Scope

- Integrate a real AI/ML design model
- Add construction-grade CAD/BIM export
- Use regional construction-cost data
- Create true interactive 3D models
- Add cloud storage, authentication, and architect validation
