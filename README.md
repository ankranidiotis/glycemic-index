# Glycemic Index & Load App

A lightweight static web app (in Greek) for exploring food glycemic index (GI), glycemic load (GL), and calculating total GL for a meal.

## Overview

This project provides:

- A food catalog with GI, GL, available carbs, and suggested max quantity.
- A meal calculator that sums the GL of multiple selected foods.
- An info page with GI/GL guidance and interpretation.
- Dark mode support across pages.

Data is loaded client-side from a local SQLite database using sql.js.

## Main Pages

- `index.html`: Food catalog and per-food GI/GL details.
- `mealcalc.html`: Meal GL calculator.
- `info.html`: Explanatory information for GI/GL concepts.

## Tech Stack

- HTML, CSS, JavaScript (vanilla)
- Bootstrap 5 + Bootstrap Icons (CDN)
- sql.js (CDN) for in-browser SQLite queries
- Local SQLite dataset: `assets/food_database.sqlite`

## Project Structure

```text
.
├── app.js                 # Logic for food catalog page
├── appmeal.js             # Logic for meal calculator page
├── index.html
├── mealcalc.html
├── info.html
├── styles.css
├── assets/
│   ├── food_database.sqlite
│   └── ...
└── img/                   # Food images used by the app
```

## Local Development

Because the app fetches local files (including SQLite data), run it with a local HTTP server instead of opening HTML files directly.

### Option 1: Python HTTP server

```bash
uv run python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/mealcalc.html`
- `http://localhost:8000/info.html`

### Option 2: VS Code Live Server

1. Open the project in VS Code.
2. Start Live Server from `index.html`.
3. Navigate between pages from the top menu.

## How It Works

- On load, the app initializes sql.js and fetches `assets/food_database.sqlite`.
- Food names are queried from the `FOOD` table and rendered in dropdowns.
- GI/GL values are color-coded (low/medium/high) in the UI.
- Meal GL is computed by summing item GL values, with unit conversion via DB lookup tables.

## Notes

- The app uses cache-busting when fetching the SQLite file to avoid stale browser caches.
- Ensure files in `img/` match image names stored in the database.
- If you deploy to static hosting, keep folder paths unchanged unless you update references in HTML/JS.

## Version

Current footer version in the app: `v1.0.0`
