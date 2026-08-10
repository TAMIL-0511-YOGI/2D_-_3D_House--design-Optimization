# AI-Powered Smart Home Design & Optimization

## Abstract

AI-Powered Smart Home Design & Optimization is an intelligent architectural planning platform that generates professional 2D and 3D floor-plan concepts from user requirements. Users can specify land area, building type, floors, rooms, entrance direction, parking, and Vastu preferences. The system applies architectural planning rules and AI-inspired optimization to produce dimensioned layout sketches, furnished 2D floor-plan views, and 3D floor-plan-style visualizations, with alternative layouts available through regeneration. It simplifies early home planning, reduces design effort and cost, and helps users visualize personalized building concepts before construction.

## SDG Mapping

**SDG 11 – Sustainable Cities and Communities** is the project's primary Sustainable Development Goal. Dream Home Designer helps people explore more thoughtful, inclusive, and space-efficient housing concepts for homes, rental properties, and apartments. Its options for accessible design, shared facilities, and solar power can support more livable and resilient communities.

The optional solar-power features also provide a secondary connection to **SDG 7 – Affordable and Clean Energy**.

## Run locally

From this folder, run:

```powershell
python app.py
```

Then open http://localhost:8000 in a browser.

## Current functionality

- Home / rental / apartment project modes
- Land, floors, direction, style, rooms, and rental-unit inputs
- Fresh generated concept metrics on every generation
- Drag-to-rotate visual 3D concept preview
- Local JSON save library (`data/saved_designs.json`)
- Exportable JSON project brief

## Recommended saving formats

Use JSON for editable project requirements (implemented), PNG/JPG for design previews, PDF for client-facing briefs, and GLB for future interactive 3D models. For professional construction, export IFC/DWG through a specialist CAD/BIM workflow after architect review.
