# About Project: AI-Powered Smart Home Design & Optimization

## 1. Project overview

**AI-Powered Smart Home Design & Optimization** is an intelligent architectural-planning prototype that transforms a user's building requirements into optimized, professional 2D and 3D floor-plan concepts. Users provide land area, building type, floors, rooms, entrance direction, parking, and Vastu preferences; the system generates dimensioned architectural sketches, furnished 2D views, and 3D floor-plan-style visualizations, with alternatives available through regeneration. It supports early home planning, lowers initial design effort, and helps users visualize personalized buildings before construction.

The project is designed as a UI/UX prototype for early-stage home planning. It is useful for exploring ideas, not for producing construction-ready architectural drawings.

## 2. What the application does

The user journey has five screens:

1. **Welcome screen** — introduces the DreamHome AI experience.
2. **Design brief** — collects the user's requirements.
3. **Concept viewer** — shows the generated residence name, built-up area, score, floor selector, and plan view.
4. **Previous designs** — reopens concepts generated in the current browser.
5. **Save screen** — saves the current concept to the project’s local JSON library.

## 3. Inputs the user can provide

The design form supports three project types:

- Dream Home
- Rental Homes
- Apartment

It also collects land size, floor count, entrance direction, architecture style, budget, Vastu preference, bedrooms, bathrooms, kitchens, parking, optional rooms, and free-text ideas.

Depending on the project type, the form reveals extra options. For example, a personal home can include a garden, balcony, smart-home features, solar panels, lift, or elder-friendly design. Rental and apartment options include units, blocks, shared facilities, parking, meters, security, and common solar power.

## 4. How generation works

When the user clicks **Create my design**, the browser sends the completed form data to `POST /api/generate`.

The Python server creates a new concept using randomized calculations:

- A unique concept ID and seed are generated.
- Built-up area is estimated from land size and a random coverage factor.
- Estimated cost is calculated from built-up area, number of floors, and a random rate.
- A design score is generated in the range 82–96.
- The selected architectural style becomes the concept title, such as “Modern Residence.”

The browser uses the returned seed, form data, selected floor, and layout variation to build an SVG floor-plan display. Regenerating a concept increases a layout cycle value, so the room arrangement can change.

### Important limitation

Despite the name “AI,” this version does **not** call OpenAI, another machine-learning model, an image generator, or CAD/BIM software. Its output is a procedural, randomized concept simulation. The cost, score, and area are illustrative estimates only and should not be used for construction, legal approval, or budgeting decisions.

## 5. Visual concept viewer

The viewer supports these presentation modes:

- Pencil floor plan
- Furnished 2D plan
- 3D floor-plan-style rendering

The plan is rendered in the browser as SVG and styled with CSS. It can show multiple floors and, for eligible multi-floor dream homes, a terrace. The layout uses room categories such as living area, kitchen, dining, bedrooms, bathrooms, entry, and outdoor area. Visual styles and palette details vary with the generated seed.

## 6. Saving and history

The project uses two separate storage methods:

| Feature | Storage location | Purpose |
| --- | --- | --- |
| Previous designs | Browser `localStorage` | Stores up to 15 generated concepts for the current browser. |
| Save my concept | `data/saved_designs.json` | Persists saved concepts on the local server. |

`GET /api/designs` can return the server-side saved JSON library. The current interface’s Previous designs page reads browser storage, while the server-side JSON file acts as a separate persistent archive.

## 7. Technologies used

| Technology | Where used | Why it is used |
| --- | --- | --- |
| Python standard library | `app.py` | Runs the local HTTP server and JSON API. |
| `http.server` / `ThreadingHTTPServer` | `app.py` | Serves the website and handles multiple local requests. |
| HTML5 | `static/index.html` | Defines the screens, form controls, buttons, and page structure. |
| CSS3 | `static/style.css`, `static/hero-image.css` | Creates the responsive visual design, animations, plans, and layouts. |
| Vanilla JavaScript | `static/app.js` | Controls navigation, form state, API calls, SVG plan rendering, and local history. |
| SVG generated in JavaScript | `static/app.js` | Draws the floor-plan concepts without an external drawing library. |
| JSON | `data/saved_designs.json` | Stores saved concept records locally. |
| Google Fonts | `index.html` | Loads the DM Sans and Outfit fonts for the interface. |
| Image asset | `static/modern-house.jpg` | Provides the architectural background visual. |

There is no framework, package manager, database server, or external backend dependency. This makes the prototype simple to run locally.

## 8. Project file structure

```text
DREAM HOME/
├── app.py                    # Python server and JSON API
├── README.md                 # Short setup and feature notes
├── ABOUT_PROJECT.md          # This detailed project explanation
├── data/
│   └── saved_designs.json    # Locally saved design concepts
└── static/
    ├── index.html            # Web page structure and design form
    ├── app.js                # Browser functionality and plan generation
    ├── style.css             # Main interface styles
    ├── hero-image.css        # Landing/brief image treatments
    └── modern-house.jpg      # Background house image
```

## 9. API endpoints

| Endpoint | Method | What it does |
| --- | --- | --- |
| `/api/generate` | POST | Accepts form data and returns a fresh simulated concept. |
| `/api/save` | POST | Adds a concept record and UTC save time to `data/saved_designs.json`. |
| `/api/designs` | GET | Returns all concepts saved in `data/saved_designs.json`. |

All other requests are served as static files from the `static` folder.

## 10. How to run it

1. Open PowerShell in this project folder.
2. Run:

   ```powershell
   python app.py
   ```

3. Open `http://localhost:8000` in a web browser.
4. Choose **Start designing**, complete the brief, and create a concept.

The terminal will show that the server is running. Stop it with `Ctrl + C` when finished.

## 11. Sustainable Development Goal connection

The project primarily relates to **UN SDG 11: Sustainable Cities and Communities** because it encourages users to think about space-efficient, accessible, shared, and resilient housing options. Solar options give it a secondary connection to **SDG 7: Affordable and Clean Energy**.

## 12. What could be added in the future

- Connect a real AI model for natural-language design guidance.
- Generate architectural images from the submitted brief.
- Replace rough estimates with regional construction cost data.
- Add account-based cloud saving and a real database.
- Display designs saved through `/api/designs` inside the history page.
- Export client briefs as PDF and plans as PNG/SVG.
- Integrate professional CAD/BIM formats such as IFC, DWG, or GLB after architect review.
- Add validation, accessibility checks, user authentication, and production security controls.

## 13. Summary

Dream Home Designer is a responsive local web prototype for collecting housing requirements and turning them into explorable visual concepts. It combines a lightweight Python API with a framework-free frontend, browser-based SVG plan generation, local history, and JSON saving. Its purpose is early inspiration and requirement gathering; professional architectural review is required before any real-world building work.
