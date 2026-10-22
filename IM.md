# Installation & Deployment Manual (IM.md)
## Deep Learning Smart Home Design & Optimization (DreamHome AI)

---

### Document Overview
* **Project Name:** Deep Learning Smart Home Design & Optimization (DreamHome AI)
* **GitHub Repository:** [TAMIL-0511-YOGI/2D_-_3D_House--design-Optimization](https://github.com/TAMIL-0511-YOGI/2D_-_3D_House--design-Optimization)
* **File:** `IM.md` (Installation Manual)
* **Target Audience:** Developers, Academic Evaluators, Architects, and General Users
* **Primary Objective:** Provide complete, step-by-step guidance for setting up, running, configuring, and verifying the application on any local system.

---

## 1. System Requirements

### 1.1 Hardware Specifications
| Specification | Minimum Requirement | Recommended |
|---|---|---|
| **Processor (CPU)** | 2.0 GHz Dual-Core Intel / AMD / Apple Silicon | 2.5 GHz Quad-Core or higher |
| **Random Access Memory (RAM)** | 4 GB | 8 GB or higher |
| **Storage Space** | 250 MB free disk space | 1 GB free disk space |
| **Display Resolution** | 1280 × 720 (HD) | 1920 × 1080 (Full HD) or higher |
| **Graphics (GPU)** | Integrated Graphics with WebGL support | Dedicated GPU or modern integrated graphics |

### 1.2 Operating System Compatibility
* **Windows:** Windows 10 / Windows 11 (64-bit)
* **macOS:** macOS 10.15 (Catalina) or newer
* **Linux:** Ubuntu 20.04+, Debian 11+, Fedora 34+, Arch Linux, or any standard Linux distribution

### 1.3 Software Prerequisites
1. **Python:**
   * Version **3.8, 3.9, 3.10, 3.11, or 3.12+**
   * *Note:* The prototype runtime uses only standard Python libraries (`http.server`, `urllib.parse`, `json`, `pathlib`, `random`, `datetime`). No external `pip` packages are strictly required to start the web application.
2. **Web Browser:**
   * Modern browser with HTML5, CSS Grid/Flexbox, SVG rendering, and WebGL support.
   * Google Chrome (v90+), Microsoft Edge (v90+), Mozilla Firefox (v88+), Brave, or Safari (v14+).
3. **Git (Optional but recommended):**
   * Git 2.30+ for cloning and pushing updates.

---

## 2. Project Architecture & Directory Structure

```plaintext
DREAM HOME/
├── app.py                             # Lightweight HTTP server & REST API handler
├── README.md                          # Project abstract, SDG mapping, and quickstart
├── ABOUT_PROJECT.md                   # Complete architectural and algorithmic description
├── DATASET_REVIEW.md                  # Dataset specifications and comparison studies
├── PP-1.md                            # Presentation 1: System overview & literature review
├── PP-2.md                            # Presentation 2: Technical review & module breakdown
├── IM.md                              # Official Installation & Deployment Manual
├── proposed-work-block-diagram.svg    # System block diagram
│
├── ml/                                # Deep-Learning Subsystem
│   ├── __init__.py                    # Module indicator
│   ├── model.py                       # Neural layout model specification & metadata
│   ├── predict.py                     # Layout score inference & concept adapter
│   └── train.py                       # Future neural training entry-point stub
│
├── data/                              # Data Persistence & Benchmarks
│   ├── dreamhome_design_dataset.json  # 18 structured benchmark design briefs
│   └── saved_designs.json             # Saved user floor plans and configuration archive
│
└── static/                            # Frontend Client Assets
    ├── index.html                     # Responsive single-page application structure
    ├── style.css                      # UI design system, glassmorphism, responsive styles
    ├── hero-image.css                 # Hero header layout & positioning
    ├── modern-house.jpg               # High-resolution architectural preview graphic
    └── app.js                         # 2D/3D SVG generator, Three.js viewer, & UI logic
```

---

## 3. Step-by-Step Installation & Setup

### Step 1: Clone or Download the Repository

#### Option A: Using Git (Recommended)
Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:
```bash
git clone https://github.com/TAMIL-0511-YOGI/2D_-_3D_House--design-Optimization.git
```

Navigate into the cloned folder:
```bash
cd 2D_-_3D_House--design-Optimization
```

*(If you already have the repository locally in `c:\Users\yogit\Documents\VS code Files\DREAM HOME`, simply navigate to that directory).*

```powershell
cd "c:\Users\yogit\Documents\VS code Files\DREAM HOME"
```

#### Option B: Download ZIP
1. Visit [TAMIL-0511-YOGI/2D_-_3D_House--design-Optimization](https://github.com/TAMIL-0511-YOGI/2D_-_3D_House--design-Optimization).
2. Click **Code** -> **Download ZIP**.
3. Extract the ZIP archive into your desired folder.
4. Open the folder in VS Code or your terminal.

---

### Step 2: Verify Python Installation
Check that Python is installed and accessible in your system PATH:

**On Windows (PowerShell or Command Prompt):**
```powershell
python --version
```
*or*
```powershell
py --version
```

**On macOS / Linux:**
```bash
python3 --version
```

*Expected output:* `Python 3.10.x` (or any version 3.8+).

> [!NOTE]
> If Python is not recognized, download and install it from [python.org](https://www.python.org/). During installation on Windows, ensure the checkbox **"Add Python to PATH"** is selected.

---

### Step 3: (Optional) Set Up a Virtual Environment
While the core web application runs directly using Python standard libraries without external packages, setting up an isolated virtual environment is standard practice for forward compatibility with future deep-learning libraries:

**On Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 4. Running the Application

### 4.1 Launch the Local Server
From the root directory of the project, execute:

```powershell
python app.py
```

### 4.2 Expected Terminal Output
Once launched, you will see the confirmation message:
```plaintext
DreamHome AI running at http://localhost:8000
```

### 4.3 Access the Web Interface
1. Open your preferred web browser (Chrome, Edge, Firefox, Brave, or Safari).
2. Navigate to:
   ```text
   http://localhost:8000
   ```
   *(or `http://127.0.0.1:8000`)*
3. The **DreamHome AI: Deep Learning Smart Home Design & Optimization** welcome screen will load.

---

## 5. Port Configuration & Advanced Launch Options

### 5.1 Changing the Default Port
If port `8000` is already in use by another service on your machine, you can change the port:

1. Open [app.py](file:///c:/Users/yogit/Documents/VS%20code%20Files/DREAM%20HOME/app.py) in any editor.
2. Locate lines 110–111:
   ```python
   print("DreamHome AI running at http://localhost:8000")
   ThreadingHTTPServer(("", 8000), Handler).serve_forever()
   ```
3. Change `8000` to any preferred available port (e.g., `8080` or `5000`):
   ```python
   PORT = 8080
   print(f"DreamHome AI running at http://localhost:{PORT}")
   ThreadingHTTPServer(("", PORT), Handler).serve_forever()
   ```
4. Save the file and restart `python app.py`.

### 5.2 Stopping the Server
To stop the local web server at any time, return to your terminal and press:
```plaintext
Ctrl + C
```

---

## 6. Functional Verification & Feature Walkthrough

After launching the application, verify that all core modules operate properly:

| Test Case | Steps to Execute | Expected Result |
|---|---|---|
| **1. Welcome Screen** | Open `http://localhost:8000` | High-resolution architectural preview loads with title and "Start designing" CTA button. |
| **2. Design Brief Input** | Click **Start designing →** | Interactive form opens. Allows toggling between **Home**, **Rental**, and **Home + Rental**. |
| **3. Parameter Customization** | Modify land area (e.g., 2400 sq ft), floors (1-4), entrance facing, bedroom/bathroom counters, and features. | Dynamic UI counters increment/decrement accurately; dependent feature checkboxes update. |
| **4. Deep-Learning Inference & Generation** | Click **Create my design →** | Sends `POST /api/generate` payload to backend. Displays generated concept title, built-up area, and Model Score (e.g., 94/100). |
| **5. 2D Architectural Draft Mode** | Click **PENCIL FLOOR PLAN** | Renders high-precision blueprint-style 2D architectural sketch with dimension lines. |
| **6. 2D Furnished Mode** | Click **FURNISHED 2D PLAN** | Shows zoned, colored rooms with walls, labelled doors, windows, and furniture layouts. |
| **7. 3D Cutaway Isometric Mode** | Click **3D FLOOR PLAN** | Activates WebGL / Three.js 3D isometric view with camera angle controls (Isometric 3D vs. Top-Down). |
| **8. Multi-Floor Navigation** | Use floor selector buttons (Ground Floor, 1st Floor, etc.) | Floor plans switch smoothly, maintaining spatial alignment. |
| **9. Style Regeneration** | Click **Regenerate layout** | Re-queries the generation engine to produce alternative spatial archetypes (Courtyard, L-Shaped, Dual-Wing, etc.). |
| **10. Local Design Saving** | Click **Save this design** | Dispatches `POST /api/save`. Configuration is written to `data/saved_designs.json` and shown in recent history. |

---

## 7. Backend API Specification

The local Python server exposes lightweight REST endpoints consumed by `static/app.js`:

### 7.1 `POST /api/generate`
* **Purpose:** Generates layout metrics, spatial style, and neural quality score based on the design brief.
* **Request Body (JSON):**
  ```json
  {
    "propertyType": "Dream Home",
    "landSize": 2400,
    "floors": 2,
    "entrance": "North-facing",
    "style": "Contemporary",
    "budget": "₹1 crore – ₹2 crore",
    "vastu": "Vastu preferred",
    "bedrooms": 3,
    "bathrooms": 2,
    "kitchens": 1,
    "parking": "2 cars",
    "features": ["livingRoom", "dining", "poojaRoom", "homeOffice", "solarPanels"],
    "layoutCycle": 0
  }
  ```
* **Response (JSON):**
  ```json
  {
    "id": "DH-4821",
    "seed": 4821,
    "builtUp": 4800,
    "landSize": 2400,
    "floors": 2,
    "propertyType": "Dream Home",
    "cost": 9600000,
    "style": "Courtyard Modern Residence",
    "score": 93,
    "message": "A deep-learning layout concept is ready to explore.",
    "model": "DreamHome Neural Layout Generator",
    "modelVersion": "0.1-architecture",
    "modelStage": "deep-learning-ready hybrid prototype"
  }
  ```

### 7.2 `POST /api/save`
* **Purpose:** Saves the active design concept to the local persistent library.
* **Target File:** `data/saved_designs.json`
* **Response (JSON):**
  ```json
  {
    "ok": true,
    "count": 1
  }
  ```

### 7.3 `GET /api/designs`
* **Purpose:** Fetches all saved design records from `data/saved_designs.json`.
* **Response (JSON):** Array of saved design objects.

---

## 8. Optional: Future Deep-Learning Extension Setup

The repository is pre-structured to integrate full deep-learning neural layout generators (such as HouseGAN++, Graph2Plan, or relational Graph Convolutional Networks).

If you plan to develop or train the neural models in `ml/`:

1. **Install Deep Learning Frameworks:**
   ```bash
   pip install torch torchvision torchaudio
   pip install torch-geometric
   # OR for TensorFlow
   pip install tensorflow
   ```
2. **Inspect Model Specifications:**
   * Review [ml/model.py](file:///c:/Users/yogit/Documents/VS%20code%20Files/DREAM%20HOME/ml/model.py) for the input/output tensor contract.
   * Review [ml/predict.py](file:///c:/Users/yogit/Documents/VS%20code%20Files/DREAM%20HOME/ml/predict.py) to plug in PyTorch model inference (`.pth` weights).
   * Review [ml/train.py](file:///c:/Users/yogit/Documents/VS%20code%20Files/DREAM%20HOME/ml/train.py) for training split criteria on datasets such as RPLAN or HouseGAN++.

---

## 9. Troubleshooting & FAQ

### Q1: `OSError: [Errno 10048] Address already in use`
* **Cause:** Another process is already running on port 8000 (such as an earlier instance of `app.py` or another dev server).
* **Fix on Windows PowerShell:**
  ```powershell
  # Find the process ID using port 8000
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```
* *Alternative Fix:* Change the port number in [app.py](file:///c:/Users/yogit/Documents/VS%20code%20Files/DREAM%20HOME/app.py) to `8080` or `8001`.

---

### Q2: `'python' is not recognized as an internal or external command`
* **Cause:** Python is not added to your system environment `PATH` variable.
* **Fix:**
  1. Re-run the Python installer.
  2. Select **Modify**.
  3. Check the box **"Add Python to environment variables"** or **"Add Python to PATH"**.
  4. Restart your terminal.

---

### Q3: 3D Floor Plan View is Blank or Three.js does not render
* **Cause:** The browser cannot load the external Three.js CDN scripts, or WebGL is disabled.
* **Fix:**
  1. Ensure an active internet connection so the browser can load Three.js from Cloudflare CDN (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`).
  2. In your browser settings, check that **Hardware Acceleration** and **WebGL** are enabled.
  3. Verify in browser developer tools (`F12` -> Console) that no script blocking extensions (e.g. adblockers) are interfering.

---

### Q4: Browser reflects outdated code or style changes
* **Cause:** Web browser cached previous static asset responses.
* **Fix:**
  * Perform a hard refresh:
    * **Windows/Linux:** `Ctrl + F5` or `Ctrl + Shift + R`
    * **macOS:** `Cmd + Shift + R`
  * Or open an **Incognito / Private Window** to `http://localhost:8000`.

---

## 10. Summary Checklist

To confirm a successful installation:
- [x] Python 3.8+ installed and accessible via command line.
- [x] Project files cloned / placed in local workspace.
- [x] Server started via `python app.py`.
- [x] Web browser connected to `http://localhost:8000`.
- [x] Able to complete a design brief and visualize 2D & 3D plans.
- [x] Saved designs persist to `data/saved_designs.json`.
