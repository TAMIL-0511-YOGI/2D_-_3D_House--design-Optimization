# AI Dream Home Designer: Deep Learning & Smart Optimization
## Presentation 2 (PP-2) — Project Review & Technical Overview

---

### Slide 1: Title & Agenda
**Project Title:** AI Dream Home Designer — Deep Learning Architectural Planning & Optimization  
**Domain:** Deep Learning, Generative AI, Computational Architecture, Web Systems  

#### **Presentation Agenda:**
1. Abstract
2. Base Paper
3. Literature Survey
4. Architecture Diagram
5. System Modules
6. Module Description
7. Dataset and Techniques Used
8. Status of Work Done (Current Progress & Next Milestones)

---

### Slide 2: Abstract
* **Problem Statement:** Manual architectural planning is iterative, expensive, and time-consuming for prospective homeowners who need quick feasibility studies and compliant layout concepts.
* **Proposed Solution:** A hybrid deep-learning and rule-validated architectural generation system that converts user design briefs (plot dimensions, room counts, Vastu compliance, budget, and parking) into functional 2D and 3D floor plans.
* **Core Philosophy:** 
  * Uses **Deep Learning (GNN & Generative Models)** to understand spatial topology, room adjacencies, and layout patterns.
  * Uses **Deterministic Constraint Validation** for safety, setback regulations, and Vastu orientation checks.
  * Provides **Interactive SVG Visualization** (Pencil 2D, Furnished 2D, and Isometric 3D views) directly in the browser.

---

### Slide 3: Base Paper
* **Title:** *HouseGAN++: Generative Adversarial Network for House Layout Generation with Relational and Structural Constraints*
* **Authors / Reference:** Nelson Nauata et al. (IEEE/CVF CVPR / ECCV) & *Graph2Plan: Graph-based Architectural Layout Generation* (SIGGRAPH).
* **Key Insights Adapted:**
  * Architectural floor plans are represented as **graphs** where nodes are rooms and edges represent doors/adjacencies.
  * Separates layout generation into two stages: **(1) Relational Graph Prediction** and **(2) Spatial Boundary & Geometry Optimization**.
* **Project Enhancement:** Integration of automated Indian architectural guidelines (Vastu Shastra), multi-floor layout coherence, and instant client-side SVG rendering without requiring heavy CAD workstations.

---

### Slide 4: Literature Survey

| No. | Paper / System | Methodology Used | Strengths | Limitations / Gaps Addressed in Our Work |
|:---:|:---|:---|:---|:---|
| **1** | **HouseGAN / HouseGAN++** *(Nauata et al.)* | Relational GAN on bubble diagrams | Generates non-trivial room arrangements and graph-driven layouts | Lacks orientation (Vastu) constraints and interactive client-side 3D visualization |
| **2** | **Graph2Plan** *(Hu et al., SIGGRAPH)* | GNN + Floorplan Boundary Optimization | Realistic wall alignments and structural boundary fit | High computational cost; lacks instant consumer-grade web interface |
| **3** | **DeepFloorplan** *(Zeng et al., CVPR)* | Deep ConvNet for Room & Boundary Recognition | High accuracy in recognizing functional zones and boundaries | Primarily analytical/recognition-focused rather than generative from user brief |
| **4** | **Rule-Based Automated CAD Tools** | Expert Systems & Heuristic Packing | 100% compliant with setback & building bylaws | Rigid, non-creative, unable to generalize to diverse aesthetic preferences |

---

### Slide 5: System Architecture Diagram

```mermaid
flowchart TD
    subgraph UI ["1. Client Layer (Web Browser)"]
        A[User Input Brief\n- Plot Size, Rooms, Floors\n- Vastu, Facing, Budget] --> B[Client Engine / app.js]
        B -->|HTTP POST /api/generate| C[Flask / Python Backend]
        K[Interactive 2D/3D SVG Viewport] <-- B
    end

    subgraph Backend ["2. Core Processing Layer (app.py)"]
        C --> D[Request Validator & Sanitizer]
        D --> E[ML Pipeline Gateway ml/predict.py]
    end

    subgraph ML_Engine ["3. Intelligence & Validation Layer"]
        E --> F[Room Adjacency & Topology Engine]
        F --> G[Spatial Constraint & Geometry Resolver]
        G --> H[Vastu & Setback Deterministic Validator]
        H --> I[Scoring Engine\n- Layout, Cost & Utility Score]
    end

    subgraph Storage ["4. Storage & Persistence"]
        I --> J[JSON Response Formatter]
        J -->|JSON Concept Payload| B
        C <--> L[(data/saved_designs.json)]
    end
```

---

### Slide 6: Modules Breakdown

The system is organized into **6 core functional modules**:

1. **Module 1: User Requirement Collection & Parameterization**  
   * Captures plot dimensions, orientation, budget, floor count, and functional preferences.
2. **Module 2: ML Inference & Layout Topology Adapter (`ml/`)**  
   * Interfaces with deep learning representations to model room graph adjacencies.
3. **Module 3: Constraint Validation & Rule Optimization Engine**  
   * Validates structural setbacks, room aspect ratios, and Vastu orientations.
4. **Module 4: Intelligent Scoring & Cost Estimation Engine**  
   * Calculates layout efficiency, functional zoning score, and approximate material cost.
5. **Module 5: Multi-Floor 2D & Isometric 3D SVG Renderer**  
   * Generates dynamic vector plans (Pencil CAD style, Furnished view, and 3D axonometric view).
6. **Module 6: History Management & Concept Persistence**  
   * Allows saving, comparison, retrieval, and re-generation of floor-plan iterations.

---

### Slide 7: Module Description

* **M1 — Requirement Collection:**  
  * *Inputs:* Property Planning Mode (**Independent Home**, **Full Rental Building**, or **Home + Rental (Owner Ground + Upper Rentals)**), Facing direction (N/S/E/W), Plot area, Number of floors, Room requirements (BHK, Pooja, Balcony, Car Parking), Vastu priority, and Tenant Separation options (External Staircase, Sub-meters, Private gates).
  * *Output:* Normalized structured JSON design brief.
* **M2 — ML Inference Adapter:**  
  * *Mechanism:* Abstracted pipeline (`ml/model.py`, `ml/predict.py`) that predicts relational node-edge matrices between functional zones.
* **M3 — Constraint & Vastu Validator:**  
  * *Mechanism:* Ensures Kitchen in SE/NW, Master Bedroom in SW, Pooja room in NE, and verifies independent staircase/entry access paths for multi-family/tenant zoning.
* **M4 — 2D & 3D Interactive Renderer:**  
  * *Mechanism:* Pure client-side SVG generation engine rendering exact room boundaries, wall thicknesses, door swings, furniture layouts, and 3D depth projections for Owner and Tenant floors.
* **M5 — Storage & Export:**  
  * *Mechanism:* Local JSON database (`data/saved_designs.json`) + browser caching for zero-latency design switching.

---

### Slide 8: Dataset & Techniques Used

#### **1. Datasets**
* **Active Benchmark Dataset:** `data/dreamhome_design_dataset.json` containing structured property briefs, spatial configurations, and optimization parameters for regression testing.
* **Target ML Training Corpora:**
  * **RPLAN Dataset:** Over 80,000 human-designed residential architectural floor plans with labelled rooms, walls, and doors.
  * **Lifull / Modified HouseGAN Dataset:** Vectorized graph-annotated residential layouts.

#### **2. Techniques & Tech Stack**
* **Deep Learning & Algorithms:**
  * Graph Neural Networks (GNN) / Relational Graph Convolution for room topology.
  * Heuristic & Deterministic Constraint Satisfaction Algorithms (CSP) for layout legality.
  * Learning-to-Rank / Multi-Factor Scoring for design rating.
* **Software & Web Stack:**
  * **Backend:** Python 3 standard server / REST API endpoints (`/api/generate`, `/api/save`, `/api/designs`).
  * **Frontend:** Vanilla JavaScript (ES6+), HTML5, Custom CSS3 Design System.
  * **Graphics:** Scalable Vector Graphics (SVG) with mathematical coordinate transformations for 2D & 3D rendering.

---

### Slide 9: Status of the Work Done

#### **Completed So Far (Phase 1 & 2):**
* [x] **Full-Featured User Interface:** Modern, responsive dark-themed UI for requirement collection and customization.
* [x] **ML Architecture Boundary:** Decoupled `ml/` package (`model.py`, `predict.py`, `train.py`) ready for model weights.
* [x] **Inference & REST API Pipeline:** Active `/api/generate` endpoint returning multi-floor layout configurations and scores.
* [x] **Multi-Mode Visualization Engine:** Real-time generation of:
  * 2D Technical Pencil Floor Plan
  * 2D Furnished Interior Layout
  * 3D Isometric / Axonometric Cut-Section View
* [x] **Constraint & Vastu Checking Logic:** Orientation-aware placement validation.
* [x] **Persistence Layer:** Concept saving, retrieval, and browser history caching.

#### **In-Progress / Next Phase (Phase 3):**
* [ ] Training custom GNN weights on the RPLAN vectorized dataset.
* [ ] Export to construction-ready formats (.DXF / .DWG / PDF blueprints).
* [ ] Live cost calculation based on localized real-time material price indexes.

---

### Slide 10: Conclusion & Q&A
* **Summary:** DreamHome AI provides an end-to-end intelligent bridge between consumer design requirements and architectural layout generation.
* **Key Advantage:** Fast, interactive, Vastu-compliant, zero-dependency deployment with a structured deep-learning pipeline.
* **Open for Questions & Discussion!**
