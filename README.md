# HEC Scholarship Finder

A minimal full-stack FastAPI application for discovering Government of Pakistan / HEC scholarship opportunities by country and course level.

## Run locally

```powershell
python -m venv .venv
\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`.

The SQLite cache is created at `data/scholarships.db`. Offline demo records come from `data/raw/scholarships.json`, so search and the UI continue to work without internet access.

## API

- `GET /` — conversational Tailwind UI
- `GET /api/scholarships?country=&course_level=` — list/filter scholarships
- `GET /api/search?country=China&course_level=Masters` — search
- `POST /api/search` — search with JSON `{ "country": "China", "course_level": "Masters" }`
- `POST /api/refresh` — attempt a live refresh, falling back to seed/cache data

The refresh endpoint uses HEC's public page as a best-effort source. It falls back to the local seed if network access, parsing, or the live source fails.
