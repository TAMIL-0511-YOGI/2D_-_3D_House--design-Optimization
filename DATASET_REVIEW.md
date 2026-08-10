# Dataset Review: DreamHome Concept Benchmark v1

## Purpose

This project does not currently train a machine-learning model. It is a rule-based, seeded procedural floor-plan prototype: `app.py` calculates concept metrics and `static/app.js` renders an SVG layout. Therefore, the appropriate dataset is a **small, structured benchmark and test dataset**, not a claimed AI training corpus.

`data/dreamhome_design_dataset.json` is a synthetic, project-specific dataset of 18 representative briefs. It lets the project demonstrate that its input fields, concept metrics, and layout categories have been tested across realistic combinations. It contains no copied floor plans, personal information, or client data.

## Dataset contents

Each record is one architectural brief. The records span the three property types offered in the interface:

| Segment | Records | What it covers |
| --- | ---: | --- |
| Dream Home | 11 | Compact 1BHK/2BHK, family duplexes, villas, accessibility, sustainability, and premium multi-floor homes |
| Rental Homes | 4 | Two to four rental units, shared parking, separate entrances, meters, and owner units |
| Apartment | 3 | Six-, eight-, and twelve-flat configurations, including blocks, lifts, security, and common solar |

### Field groups

| Field group | Dataset fields | Project use |
| --- | --- | --- |
| Site and form inputs | `land_size_sqft`, `floors`, `entrance`, `style`, `budget`, `vastu` | Directly mirrors the design brief form |
| Accommodation | `bedrooms`, `bathrooms`, `kitchens`, `parking_cars` | Tests area allocation and visible room generation |
| Type-specific inputs | `garden`, `terrace`, `rental_units`, `shared_parking`, `blocks`, `flats_per_floor` | Supports the conditional Home/Rental/Apartment form panels |
| Requested features | `features` | Records requirements such as solar panels, lift, separate entrances, and accessibility |
| Benchmark labels | `target_built_up_sqft`, `target_score`, `layout_profile`, `validation_status` | Reference values for comparing a generated concept with an expected planning category |

## Review of suitability

### What it supports well

- **Functional testing:** every property type and most form options are represented, so developers can submit each record to `POST /api/generate` and confirm that the app returns a valid concept.
- **Regression testing:** keeping fixed briefs makes it easy to notice if a later change breaks a floor count, parking logic, or layout variation.
- **Demonstration:** the dataset is much more varied than `saved_designs.json`, whose current records are predominantly 2-floor, 3-bedroom contemporary homes on 2,400 sq ft plots.
- **Future rule calibration:** `layout_profile` offers understandable labels such as `compact_2bhk` and `two_unit_rental` that can later map to real zoning rules.

### What it cannot support

- It cannot train or validate a real ML floor-plan generator: 18 synthetic records are far too few and have no vector geometry, room coordinates, adjacency graph, site dimensions, setbacks, climate, or architect-approved final drawings.
- `target_built_up_sqft` and `target_score` are illustrative benchmark labels, not construction estimates or professionally verified quality scores.
- The current renderer does not fully implement Rental Homes and Apartment spatial logic; it chiefly displays home-style room arrangements. The corresponding records expose this as a future development gap rather than hiding it.

## Data-quality review

The dataset is deliberately balanced by property type, land size (750–5,000 sq ft), floor count (1–4), entrance direction, style, and feature choice. It also includes smaller plots and no-parking cases, avoiding a dataset made only of large premium homes. Values are internally plausible as concept-level examples, but they are not region-specific building regulations.

There are three important limitations to state in a project report:

1. **Synthetic origin:** labels reflect planning assumptions created for this prototype, so they may encode those assumptions.
2. **Small sample:** it is a benchmark dataset for testing and presentation, not statistically representative of housing demand.
3. **No professional approval:** all generated and target values require architect, structural-engineer, and local-authority review before real construction.

## How it relates to existing project data

| File | Role | Should it be used as ML training data? |
| --- | --- | --- |
| `data/saved_designs.json` | Archive of concepts explicitly saved in the app | No; it is small, user-generated, and schema varies between records |
| `data/dreamhome_design_dataset.json` | Fixed synthetic benchmark created for testing, reporting, and future rule design | Not for ML training; useful for deterministic evaluation and demo scenarios |
| Browser `localStorage` | Up to 15 recent concepts in one browser | No; temporary client-side history |

## Recommended evaluation procedure

For every dataset record, submit the applicable input fields to `/api/generate`, then record: response success, generated built-up area, generated score, selected layout variation, and whether the rendered plan contains the expected high-level rooms. Compare the result with `target_built_up_sqft` only as an indicative reference. A sensible acceptance check is that the response is valid, area is positive, score lies between 82 and 96 (the current server range), and the correct property-type controls are retained.

## Path to a real AI dataset

If the project later adds ML, collect only licensed or consented examples and add: plot width/depth, setbacks, room polygons, doors/windows, adjacency relationships, north orientation, floor level, regional code constraints, climate, and architect validation. Split examples by project—not by individual floor plan—into training, validation, and test sets. That prevents near-duplicate plans from inflating results.

## Conclusion

DreamHome Concept Benchmark v1 is the right dataset for the present VS Code project because it matches the actual rule-based application. It provides transparent test cases and documentation without misrepresenting a procedural prototype as a trained AI system.
