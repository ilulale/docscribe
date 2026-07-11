# Docscribe — Implementation Plan

## Phase 1: Backend (FastAPI)

### 1.1 Project Scaffolding
- [ ] Initialize FastAPI project with `pyproject.toml` (dependencies: fastapi, uvicorn, sqlalchemy, asyncpg, httpx, python-multipart, pydantic, python-jose, passlib, weasyprint, jinja2, boto3/minio-py, celery[redis] for async tasks)
- [ ] Dockerfile for FastAPI service
- [ ] Project structure:
  ```
  backend/
  ├── app/
  │   ├── main.py
  │   ├── config.py
  │   ├── database.py
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── doctor.py
  │   │   ├── patient.py
  │   │   ├── session.py
  │   │   └── note.py
  │   ├── schemas/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── doctor.py
  │   │   ├── patient.py
  │   │   ├── session.py
  │   │   └── note.py
  │   ├── api/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── doctors.py
  │   │   ├── patients.py
  │   │   ├── sessions.py
  │   │   └── notes.py
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── audio.py
  │   │   ├── transcription.py
  │   │   ├── soap.py
  │   │   ├── pdf.py
  │   │   └── credit_tracker.py
  │   └── utils/
  │       ├── __init__.py
  │       └── openrouter.py
  └── tests/
  ```

### 1.2 Database Models & Migrations
- [ ] Define SQLAlchemy models:
  - `Doctor`: id, name, email (unique, indexed), hashed_password, is_active, is_admin, created_at
  - `Patient`: id, doctor_id (FK), name, created_at
  - `Session`: id, doctor_id (FK), patient_id (FK), audio_path, duration_seconds, status (enum: pending/transcribing/generating_soap/completed/failed), error_message, created_at, completed_at
  - `Note`: id, session_id (FK, unique), transcript, soap_json (JSONB for sections), signed_soap_text, is_signed, signed_at, created_at
  - `Invoice`: id, doctor_id (FK), amount, currency, status (enum: pending/paid/cancelled), period_start, period_end, created_at
  - `DoctorLetterhead`: id, doctor_id (FK, unique), logo_path, clinic_name, doctor_qualifications, address, phone, email, website, registration_numbers, opd_hours, created_at, updated_at
- [ ] Set up Alembic for migrations
- [ ] Initial migration

### 1.3 Auth Endpoints
- [ ] `POST /api/auth/register` — create doctor account (email + password, password hashed with bcrypt)
- [ ] `POST /api/auth/login` — return JWT access token (expiry configurable)
- [ ] `POST /api/auth/refresh` — refresh token endpoint
- [ ] `GET /api/auth/me` — current doctor profile
- [ ] JWT middleware/dependency for protected routes

### 1.4 Patient Endpoints
- [ ] `POST /api/patients` — create patient (name, auto-assigns to current doctor)
- [ ] `GET /api/patients` — list doctor's patients (search by name, paginated)
- [ ] `GET /api/patients/{id}` — patient details
- [ ] `GET /api/patients/{id}/sessions` — full history list of sessions for a patient
- [ ] `POST /api/patients/search` — search by name, return matches for disambiguation

### 1.5 Session Endpoints
- [ ] `POST /api/sessions` — create session (patient_id), returns session_id + presigned MinIO upload URL
- [ ] `POST /api/sessions/{id}/audio` — upload audio chunk/complete file to MinIO (signed URL)
- [ ] `GET /api/sessions/{id}/status` — poll session status (returns status enum + estimated progress)
- [ ] `POST /api/sessions/{id}/retry` — re-process a failed session (re-use existing audio)
- [ ] `GET /api/sessions` — list doctor's sessions (filterable by status, date range, paginated)
- [ ] `GET /api/sessions/{id}` — full session details including note

### 1.6 Note Endpoints
- [ ] `GET /api/sessions/{id}/note` — get the current SOAP note (unsaved draft)
- [ ] `PUT /api/sessions/{id}/note` — save doctor's edits to the SOAP note
- [ ] `POST /api/sessions/{id}/sign` — sign the note (finalize, mark is_signed=true, record signed_at)
- [ ] `GET /api/sessions/{id}/note/pdf` — generate and return PDF with letterhead + signed SOAP note
- [ ] `POST /api/sessions/{id}/regenerate` — re-generate SOAP from existing transcript (useful if doctor changed transcript)

### 1.7 Letterhead Endpoints
- [ ] `POST /api/letterhead` — create/update letterhead config for current doctor (multipart: logo file + JSON fields)
- [ ] `GET /api/letterhead` — get current doctor's letterhead config
- [ ] `DELETE /api/letterhead/logo` — remove logo

### 1.8 Admin Endpoints
- [ ] `GET /api/admin/doctors` — list all doctors (super-admin only)
- [ ] `POST /api/admin/doctors` — create doctor account (admin)
- [ ] `PATCH /api/admin/doctors/{id}/active` — enable/disable doctor
- [ ] `GET /api/admin/invoices` — list all invoices
- [ ] `POST /api/admin/invoices` — create invoice for a doctor
- [ ] `PATCH /api/admin/invoices/{id}` — mark invoice as paid/cancelled
- [ ] `GET /api/admin/credits` — per-doctor OpenRouter credit usage (tokens consumed, estimated cost, monthly breakdown)
- [ ] `GET /api/admin/stats` — system overview (total doctors, sessions today, total sessions, etc.)

### 1.9 Audio Processing Service (Async Task)
- [ ] Celery setup with Redis as broker (or use FastAPI BackgroundTasks for simplicity)
- [ ] Service receives session_id, downloads audio from MinIO
- [ ] Transcode/verify audio format (ensure it matches expected format)
- [ ] Call OpenRouter `/chat/completions` with Gemini Flash:
  - Stage 1: Transcribe audio → get transcript
  - Update session status to `generating_soap`
  - Stage 2: Send transcript → get SOAP note as structured JSON
  - Update session status to `completed`, save transcript and SOAP to Note table
- [ ] On failure: auto-retry once, then set status to `failed` with error message
- [ ] Track token usage per session, store for credit reporting

### 1.10 PDF Generation Service
- [ ] Jinja2 template for letterhead + SOAP note (single continuous page)
- [ ] WeasyPrint conversion of rendered HTML to PDF
- [ ] Handle page breaks gracefully for long notes
- [ ] Embed logo image from MinIO (or as base64 for offline rendering)

### 1.11 Credit Tracking Service
- [ ] Log each OpenRouter API call: doctor_id, session_id, model, prompt_tokens, completion_tokens, cost_estimate, timestamp
- [ ] Admin endpoint aggregates by doctor/month

## Phase 2: Frontend (React + Vite + Tailwind PWA)

### 2.1 Project Scaffolding
- [ ] Initialize React + Vite project with Tailwind CSS
- [ ] Set up `vite-plugin-pwa` with service worker config
- [ ] Dockerfile for nginx serving built PWA (multi-stage build)
- [ ] Project structure:
  ```
  frontend/
  ├── src/
  │   ├── main.jsx
  │   ├── App.jsx
  │   ├── router.jsx
  │   ├── api/
  │   │   ├── client.js (axios instance with JWT interceptor)
  │   │   ├── auth.js
  │   │   ├── patients.js
  │   │   ├── sessions.js
  │   │   ├── notes.js
  │   │   ├── letterhead.js
  │   │   └── admin.js
  │   ├── hooks/
  │   │   ├── useAuth.js
  │   │   ├── useAudioRecorder.js
  │   │   ├── useSessionPolling.js
  │   │   └── useIndexedDB.js
  │   ├── pages/
  │   │   ├── LoginPage.jsx
  │   │   ├── RegisterPage.jsx
  │   │   ├── Dashboard.jsx
  │   │   ├── NewSession.jsx
  │   │   ├── SessionDetail.jsx
  │   │   ├── NoteEditor.jsx
  │   │   ├── PatientHistory.jsx
  │   │   ├── LetterheadSettings.jsx
  │   │   └── admin/
  │   │       ├── DoctorsPage.jsx
  │   │       ├── InvoicesPage.jsx
  │   │       ├── CreditsPage.jsx
  │   │       └── StatsPage.jsx
  │   ├── components/
  │   │   ├── AudioRecorder.jsx
  │   │   ├── PatientSearch.jsx
  │   │   ├── SessionStatus.jsx
  │   │   ├── SoapEditor.jsx
  │   │   ├── PdfPreview.jsx
  │   │   └── layout/
  │   │       ├── AppShell.jsx
  │   │       ├── Sidebar.jsx
  │   │       └── TopBar.jsx
  │   ├── stores/
  │   │   ├── authStore.js (zustand)
  │   │   └── sessionStore.js
  │   └── utils/
  │       ├── audioTranscode.js
  │       └── formatDate.js
  ├── public/
  │   ├── manifest.json
  │   └── icons/
  ├── index.html
  └── vite.config.js
  ```

### 2.2 Auth Pages
- [ ] Login page — email + password form, error handling, redirect to dashboard
- [ ] Register page — email + password + name, auto-login after registration
- [ ] ProtectedRoute component — redirects to login if no valid JWT
- [ ] JWT token persistence in localStorage/IndexedDB, auto-refresh on 401

### 2.3 Dashboard
- [ ] Summary cards: today's sessions, pending review, recent activity
- [ ] Quick action: "New Recording" button
- [ ] Recent sessions list (clickable, goes to session detail)

### 2.4 Audio Recorder (PWA Core)
- [ ] **Pre-session form:** patient name input with autocomplete/search
  - Search existing patients as user types
  - If exact match found: show "Recording for [Name]" with link to full history
  - If multiple matches: show disambiguation list
  - If no match: "New patient" option
- [ ] **Recording screen:**
  - Large record/stop button
  - Timer (mm:ss / elapsed)
  - Audio visualizer (optional, nice-to-have)
  - Auto-save every 30s to IndexedDB (chunks)
  - On stop: show confirmation dialog
  - On confirm: transcode audio client-side (Web Audio API or FFmpeg.wasm)
  - Upload transcoded blob to MinIO presigned URL
  - Redirect to session status page
- [ ] **Resume unfinished recording:** on app load, check IndexedDB for unfinished recording, prompt to resume or discard

### 2.5 Session Status Page (Polling)
- [ ] Show session status with step indicator: Uploaded → Transcribing → Generating SOAP → Done
- [ ] Poll `GET /sessions/{id}/status` every 5s
- [ ] On `completed`: redirect to note editor
- [ ] On `failed`: show error message + "Retry" button
- [ ] Show live processing messages ("Transcribing audio...", "Generating SOAP note...")

### 2.6 Note Editor (The Core Screen)
- [ ] Fetch current SOAP note from API
- [ ] Display sections as expandable/editable text areas:
  - Subjective (with sub-labels: CC, HPI, PMH, etc. as placeholder hints)
  - Objective
  - Assessment
  - Plan
  - Additional Notes
- [ ] "Save Draft" button (saves edits without signing)
- [ ] "Review & Sign" button — confirmation dialog, then POST sign endpoint
- [ ] "Download PDF" button — opens PDF in new tab / triggers download
- [ ] "Print" button — browser print dialog with PDF
- [ ] Show original transcript in an expandable section for reference
- [ ] Auto-save draft every 60s

### 2.7 Patient History
- [ ] Full list of sessions for a patient (reverse chronological)
- [ ] Each session shows: date, status, summary preview
- [ ] Click to view the signed SOAP note (read-only mode with PDF download)
- [ ] Search/filter within patient's notes

### 2.8 Letterhead Settings Page
- [ ] Form with all letterhead fields:
  - Logo upload (image preview, drag-drop)
  - Clinic/Hospital name
  - Doctor's name & qualifications
  - Address (multiline)
  - Phone, Email, Website
  - Registration/License numbers
  - OPD hours / Consultation timings
- [ ] Real-time preview of how the letterhead will look on the PDF
- [ ] Save button

### 2.9 PDF Preview & Download
- [ ] After signing, show a preview of the generated PDF (iframe or embedded PDF viewer)
- [ ] Download button
- [ ] Print button (window.print)

### 2.10 Admin Dashboard Pages
- [ ] **Doctors page:** table of all doctors (name, email, active, registered date), create/edit/disable doctor
- [ ] **Invoices page:** list invoices, create invoice for a doctor, mark as paid
- [ ] **Credits page:** per-doctor table with monthly OpenRouter token usage + estimated cost, sortable by usage
- [ ] **Stats page:** system-level metrics (total doctors, sessions today/this month, average processing time, success rate)

### 2.11 PWA Configuration
- [ ] `manifest.json` — app name, icons (192/512), theme color, display: standalone, orientation: portrait
- [ ] Service worker — cache static assets, enable offline fallback page
- [ ] Background sync for upload retry (if doctor loses connectivity mid-upload)
- [ ] Push notifications (optional, for "SOAP note ready" alerts)
- [ ] Install prompt handling

## Phase 3: Dockerization

### 3.1 Docker Compose Setup
- [ ] Create `docker-compose.yml` with services:
  - `postgres` — official postgres:16-alpine image, persistent volume
  - `minio` — official minio/minio image, persistent volume, console port
  - `redis` — for Celery broker (optional, can use DB-based queue)
  - `backend` — FastAPI app with Dockerfile
  - `frontend` — nginx serving built PWA
  - `celery-worker` — same image as backend but with different command (for async tasks; optional)
- [ ] Environment variables file (`.env.docker`):
  - `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - `OPENROUTER_API_KEY`
  - `JWT_SECRET`, `JWT_EXPIRY`
  - `REDIS_URL` (if using Celery)
  - `CORS_ORIGINS`
- [ ] Health checks for postgres and minio
- [ ] Volume mounts for persistent data (postgres data, minio data)
- [ ] Network configuration (internal network for services, expose only backend:8000 and frontend:80)

### 3.2 Development vs Production
- [ ] Dev compose: volume-mount source code for hot-reload (uvicorn --reload, vite dev)
- [ ] Production compose: multi-stage builds, no volume mounts for code, nginx serves static files
- [ ] `docker-compose.override.yml` for dev overrides

### 3.3 SSL / Reverse Proxy
- [ ] Caddy or nginx reverse proxy in front for production
- [ ] Auto SSL (Caddy handles this natively)
- [ ] Rate limiting on auth endpoints

### 3.4 Entrypoint Scripts
- [ ] Backend entrypoint: run alembic migrations, then start uvicorn
- [ ] Wait-for-it script for postgres readiness

## Phase 4: End-to-End Testing

### 4.1 Backend Integration Tests
- [ ] Auth flow: register → login → access protected route → refresh token
- [ ] Patient CRUD: create, list, search, disambiguation
- [ ] Session lifecycle: create → upload audio → poll status → retry failed session
- [ ] Note editing: save draft → edit → sign → verify signed state
- [ ] PDF generation: verify PDF is returned with correct letterhead content
- [ ] Admin endpoints: doctor management, invoice CRUD, credit stats
- [ ] Letterhead CRUD: create with logo upload, update, delete

### 4.2 Audio Processing Tests (Mocked)
- [ ] Mock OpenRouter API responses
- [ ] Test transcribe endpoint with sample audio
- [ ] Test SOAP generation with sample transcript
- [ ] Test failure scenarios: timeout, invalid response, rate limit
- [ ] Test token usage tracking

### 4.3 Frontend Component Tests
- [ ] AudioRecorder component: record, stop, auto-save, resume
- [ ] PatientSearch: search, debounce, disambiguation UI
- [ ] SoapEditor: render sections, edit, save, sign
- [ ] SessionStatus: polling states, error display, retry button
- [ ] LetterheadSettings: form validation, preview update

### 4.4 Frontend Integration Tests (Cypress / Playwright)
- [ ] Full new session flow: login → search patient → record → stop → poll → edit → sign → download PDF
- [ ] Returning patient flow: login → same patient name → disambiguation → record → history visible
- [ ] Letterhead setup flow: upload logo → fill fields → save → verify PDF includes letterhead
- [ ] Error handling: network failure → retry → success
- [ ] PWA offline: record without internet → background sync on reconnect

### 4.5 Docker Compose E2E Tests
- [ ] `docker compose up` with all services
- [ ] API health check on all endpoints
- [ ] Full round-trip test: auth → create patient → upload dummy audio → poll → edit note → download PDF
- [ ] MinIO accessibility: verify uploaded audio file exists
- [ ] Database persistence: stop/restart containers, verify data survives
- [ ] Logging: verify all services log correctly, no silent failures

### 4.6 Performance & Load Testing
- [ ] Single session: time from audio upload to completed SOAP (target: under 2 min for 20-min audio)
- [ ] Concurrent sessions: 5-10 simultaneous processing requests
- [ ] Concurrent polling: 50+ status poll requests per second
- [ ] PDF generation: verify render time under 5s for typical note
- [ ] Identify bottlenecks (likely OpenRouter latency — manage expectations)

## Phase 5: Deployment & Polish (Post-MVP)

- [ ] Production Docker Compose with Caddy/Traefik + SSL
- [ ] Backup strategy for PostgreSQL + MinIO
- [ ] Logging aggregation (Loki / ELK or just file-based)
- [ ] Monitoring (uptime, error rates, processing latency)
- [ ] Doctor onboarding docs (screenshots + walkthrough)
- [ ] Patient data export (if doctor leaves the platform)
- [ ] Rate limiting per doctor (prevent abuse of OpenRouter credits)
- [ ] Batch PDF download (export multiple notes at once)
