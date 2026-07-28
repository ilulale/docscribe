# Per-Doctor Model Selection

**Feature:** Allow admins to select the OpenRouter model per doctor from the admin dashboard.

---

## Design Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | UI placement | Inline column with edit-in-place on DoctorsPage |
| 2 | Default model | `google/gemini-3.1-flash-lite` |
| 3 | Model input | Validated dropdown (fetch from OpenRouter API) |
| 4 | Model list caching | Backend in-memory cache with 1-hour TTL |
| 5 | Dropdown behavior | Click-to-edit searchable dropdown, auto-save on selection |
| 6 | Nullable field | Required with default (no fallback to env var) |
| 7 | Credits page pricing | Fetch pricing from OpenRouter, show accurate per-doctor estimates |
| 8 | Pricing storage | Piggyback on model cache (same endpoint returns slug + pricing) |
| 9 | Platform default | Keep hardcoded (`google/gemini-3.1-flash-lite`) |
| 10 | Self-service | Admin-only (doctors cannot change their own model) |
| 11 | Unavailable model handling | Show as legacy option with warning icon + tooltip |
| 12 | Session detail model info | Not shown to doctors |
| 13 | Note schema | Keep as-is (no `model_slug` field, infer when needed) |
| 14 | Credits page filtering | No model filter |
| 15 | Test model button | Skip |
| 16 | Audit log | Skip |
| 17 | Mobile support | Desktop-first (skip mobile optimization) |
| 18 | Keyboard navigation | Use library with built-in support (Headless UI Combobox) |
| 19 | Bulk model change | Skip |
| 20 | Model analytics | Skip |

---

## Implementation

### Database

**File:** `backend/app/models/doctor.py`

Add `openrouter_model` column to the `Doctor` model:

```python
openrouter_model: Mapped[str] = mapped_column(
    String(255),
    nullable=False,
    default="google/gemini-3.1-flash-lite",
)
```

**Migration:** New Alembic migration backfills all existing doctors with `google/gemini-3.1-flash-lite`.

---

### Backend

#### New endpoint: List available models

**File:** `backend/app/api/admin.py`

```
GET /api/admin/models
```

- Fetches from OpenRouter `GET /api/v1/models`
- Caches in-memory with 1-hour TTL
- Returns `[{ slug, name, pricing: { prompt, completion } }]`
- Pricing is in dollars per token

#### New endpoint: Update doctor model

**File:** `backend/app/api/admin.py`

```
PATCH /api/admin/doctors/{id}
```

- Request body: `{ openrouter_model: string }`
- Updates the doctor's `openrouter_model` field
- Requires admin auth

#### Update OpenRouter service

**File:** `backend/app/services/openrouter.py`

- `call_openrouter(messages)` → `call_openrouter(messages, model=None)`
- When `model` is provided, use it; otherwise fall back to `settings.openrouter_model`

#### Update processing pipeline

**File:** `backend/app/services/processing.py`

- Pass `doctor.openrouter_model` to `transcribe_audio()` and `generate_soap()`
- No longer rely on global `settings.openrouter_model` at runtime

#### Update schemas

**File:** `backend/app/schemas/admin.py`

- Add `openrouter_model` to `DoctorResponse`
- Add `DoctorModelUpdate` schema: `{ openrouter_model: str }`

---

### Frontend

#### DoctorsPage

**File:** `frontend/src/pages/admin/DoctorsPage.jsx`

- Add "AI Model" column to the doctors table
- Click-to-edit: cell shows model slug as text, click opens searchable dropdown
- Dropdown uses Headless UI Combobox (keyboard nav, search, accessible)
- Auto-saves on selection via `PATCH /api/admin/doctors/{id}`
- Warning icon + tooltip when doctor's current model is not in the available models list

#### Add Doctor form

**File:** `frontend/src/pages/admin/DoctorsPage.jsx`

- Add model dropdown to the "Add Doctor" inline form
- Pre-filled with `google/gemini-3.1-flash-lite`
- Same searchable dropdown component as the table

#### CreditsPage

**File:** `frontend/src/pages/admin/CreditsPage.jsx`

- Add "Model" column showing each doctor's selected model slug
- Fetch model list + pricing from `GET /api/admin/models`
- Calculate cost per doctor using their model's pricing:
  - `prompt_cost = prompt_tokens * model.pricing.prompt`
  - `completion_cost = completion_tokens * model.pricing.completion`
- Display accurate "Est. Cost" per doctor

#### API client

**File:** `frontend/src/api/endpoints.js`

- `listModels()` — `GET /api/admin/models`
- `updateDoctorModel(doctorId, model)` — `PATCH /api/admin/doctors/{id}`
- Update `createDoctor()` to include `openrouter_model` field
- Update `listDoctors()` response handling to include `openrouter_model`

---

## What We're NOT Doing

- No model info on session detail page
- No audit log / change history
- No bulk model changes
- No model usage analytics
- No mobile optimization for this feature
- No "test model" button
- No platform-level default model setting (keep hardcoded)
- No changes to Note schema
