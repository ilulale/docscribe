# Docscribe — Full-Stack MVP Spec

## Problem Statement

Doctors in multilingual clinical settings (primarily India) spend significant time manually writing SOAP notes after patient consultations. The consultation audio exists but converting it to structured, signed, printable clinical documentation requires tedious manual transcription and formatting. A working CLI prototype (`transcribe.py`) demonstrates that Gemini Flash via OpenRouter can transcribe Hindi/Marathi doctor-patient conversations and generate structured SOAP notes — but it outputs raw markdown files with no persistence, no multi-user support, no authentication, and no clinical workflow integration.

## Solution

Build a full-stack web application (Docscribe) that lets doctors record patient consultations on a mobile-friendly PWA, automatically transcribe and generate SOAP notes, review and edit the notes in a structured editor, sign them clinically, and download/print professional PDFs with custom letterheads. The system supports multiple doctors with isolated patient records, an admin dashboard for platform management, and tracks API credit usage per doctor.

## User Stories

### Authentication & Account Management
1. As a doctor, I want to register with my email and password, so that I have a secure account on the platform
2. As a doctor, I want to log in with my credentials, so that I can access my patients and sessions securely
3. As a doctor, I want my session to persist across browser visits, so that I don't have to log in every time
4. As a doctor, I want to be automatically logged out when my token expires, so that my data stays secure
5. As a doctor, I want to see my profile information, so that I can verify my account details

### Patient Management
6. As a doctor, I want to create a new patient record with just a name, so that I can quickly start a recording session
7. As a doctor, I want to search for existing patients by name as I type, so that I can reuse existing records instead of creating duplicates
8. As a doctor, I want to see a list of all my patients, so that I can manage my patient roster
9. As a doctor, I want to view a patient's details, so that I can verify I'm recording for the right person
10. As a doctor, I want to see a patient's full session history, so that I can review past consultations chronologically
11. As a doctor, I want the system to warn me when a patient name search returns multiple matches, so that I select the correct patient and avoid mixing up records

### Audio Recording & Upload
12. As a doctor, I want to start a new recording session by selecting or creating a patient, so that the recording is associated with the right person
13. As a doctor, I want a large, easy-to-tap record button, so that I can start recording quickly during a consultation
14. As a doctor, I want to see an elapsed timer while recording, so that I know how long the consultation has been going
15. As a doctor, I want my recording to auto-save to local storage every 30 seconds, so that I don't lose data if the app crashes
16. As a doctor, I want to stop recording and confirm the upload, so that I don't accidentally send incomplete audio
17. As a doctor, I want the audio to be transcoded client-side before upload, so that the format is consistent for processing
18. As a doctor, I want the audio uploaded directly to cloud storage via a presigned URL, so that the server doesn't have to handle large file transfers
19. As a doctor, I want to resume an unfinished recording when I reopen the app, so that I don't lose work from an interrupted session
20. As a doctor, I want to discard an unfinished recording, so that I can clean up accidental or unwanted recordings

### Session Processing & Status
21. As a doctor, I want to see a real-time status indicator after uploading audio, so that I know my recording is being processed
22. As a doctor, I want to see step-by-step progress (Uploaded → Transcribing → Generating SOAP → Done), so that I understand what's happening
23. As a doctor, I want the status to update automatically without refreshing, so that I don't have to manually check
24. As a doctor, I want to see a processing message like "Transcribing audio..." or "Generating SOAP note...", so that I know the system is working
25. As a doctor, I want to be redirected to the note editor automatically when processing completes, so that I can start reviewing immediately
26. As a doctor, I want to see an error message and a retry button if processing fails, so that I can recover without re-recording
27. As a doctor, I want to retry a failed session using the existing audio, so that I don't have to re-record the consultation

### SOAP Note Editing
28. As a doctor, I want to see the generated SOAP note in a structured editor with expandable sections (Subjective, Objective, Assessment, Plan), so that I can review each part independently
29. As a doctor, I want placeholder hints in each SOAP section (e.g., CC, HPI, PMH under Subjective), so that I understand what clinical information belongs where
30. As a doctor, I want to edit any section of the SOAP note, so that I can correct inaccuracies or add clinical details the AI missed
31. As a doctor, I want to save a draft of my edits without signing, so that I can come back and continue editing later
32. As a doctor, I want my draft to auto-save every 60 seconds, so that I don't lose work if I navigate away
33. As a doctor, I want to see the original transcript in an expandable reference section, so that I can cross-check the SOAP note against what was actually said
34. As a doctor, I want to regenerate the SOAP note from an edited transcript, so that I can improve the output if I correct the transcript
35. As a doctor, I want an "Additional Notes" section in the SOAP note, so that I can add free-form clinical observations

### Signing & PDF Generation
36. As a doctor, I want to sign a SOAP note after reviewing it, so that it becomes a finalized clinical record
37. As a doctor, I want a confirmation dialog before signing, so that I don't accidentally finalize an incomplete note
38. As a doctor, I want the signed note to be locked from further editing, so that the clinical record remains authoritative
39. As a doctor, I want to download a PDF of the signed note with my custom letterhead, so that I have a professional document for records or printing
40. As a doctor, I want to print the PDF directly from the browser, so that I can give a physical copy to the patient
41. As a doctor, I want the PDF to include my clinic logo, name, qualifications, and contact details, so that it looks professional and official
42. As a doctor, I want the PDF to handle page breaks gracefully for long notes, so that the document is readable regardless of note length

### Letterhead Configuration
43. As a doctor, I want to upload my clinic logo, so that it appears on generated PDFs
44. As a doctor, I want to fill in my clinic name, my name, qualifications, address, phone, email, website, registration numbers, and OPD hours, so that the letterhead is complete and accurate
45. As a doctor, I want to see a real-time preview of how my letterhead will look on the PDF, so that I can adjust before saving
46. As a doctor, I want to update my letterhead at any time, so that I can keep it current
47. As a doctor, I want to remove my logo if I no longer want it on the letterhead, so that I have control over my branding

### Dashboard & Navigation
48. As a doctor, I want a dashboard showing today's sessions, pending reviews, and recent activity, so that I have an at-a-glance overview of my work
49. As a doctor, I want a quick "New Recording" button on the dashboard, so that I can start a session without navigating through menus
50. As a doctor, I want to click on any session in the recent list to view its details, so that I can quickly access past work
51. As a doctor, I want a sidebar or top navigation to move between dashboard, patients, and settings, so that I can navigate the app efficiently

### Patient History & Session Review
52. As a doctor, I want to see all sessions for a patient in reverse chronological order, so that I can track the patient's consultation history
53. As a doctor, I want each session in the history to show date, status, and a summary preview, so that I can identify sessions at a glance
54. As a doctor, I want to view a signed SOAP note in read-only mode from the patient history, so that I can review past documentation
55. As a doctor, I want to download the PDF of any past signed note, so that I can re-issue documents
56. As a doctor, I want to search or filter within a patient's notes, so that I can find specific past consultations

### Admin Dashboard
57. As an admin, I want to see a list of all doctors on the platform, so that I can manage the user base
58. As an admin, I want to create new doctor accounts, so that I can onboard new users
59. As an admin, I want to enable or disable doctor accounts, so that I can control platform access
60. As an admin, I want to manage invoices for doctors (create, mark paid/cancelled), so that I can handle billing
61. As an admin, I want to see per-doctor OpenRouter credit usage with token counts and estimated costs, so that I can monitor API spending
62. As an admin, I want to see system-level stats (total doctors, sessions today, total sessions), so that I have a platform overview
63. As an admin, I want monthly breakdowns of credit usage per doctor, so that I can track usage trends

### PWA & Offline Capabilities
64. As a doctor, I want to install the app on my phone's home screen, so that it feels like a native app
65. As a doctor, I want the app to work offline for recording, so that I can record consultations without internet
66. As a doctor, I want the recording to upload automatically when connectivity is restored, so that I don't have to remember to retry
67. As a doctor, I want to receive a notification when my SOAP note is ready, so that I don't have to keep checking

### Multilingual Support
68. As a doctor, I want the system to handle Hindi, Marathi, and English consultations, so that I can record in the language my patients speak
69. As a doctor, I want the transcript to be translated to clinical English, so that the SOAP note follows standard medical documentation conventions
70. As a doctor, I want the system to handle mixed-language consultations (code-switching), so that recordings don't need to be in a single language

## Implementation Decisions

### Architecture
- **Monorepo structure** with `backend/` (FastAPI) and `frontend/` (React + Vite) directories, plus root-level `docker-compose.yml`
- **Backend** serves REST API; **frontend** is a static PWA served by nginx in production
- **PostgreSQL 16** as primary data store; **MinIO** for audio file object storage; **Redis** for Celery task queue broker
- **Celery workers** process audio asynchronously (transcription + SOAP generation) to avoid blocking the API server

### Data Model
Six core entities with these relationships:
- **Doctor** → has many Patients, Sessions, Invoices, one Letterhead
- **Patient** → belongs to one Doctor, has many Sessions
- **Session** → belongs to one Doctor and one Patient, has one Note; tracks audio file path, duration, processing status, and error state
- **Note** → belongs to one Session; stores transcript (text), SOAP sections (JSONB), signed state, and signature timestamp
- **Invoice** → belongs to one Doctor; tracks billing amounts, currency, status, and billing period
- **DoctorLetterhead** → belongs to one Doctor (1:1); stores logo path, clinic metadata (name, qualifications, address, phone, email, website, registration numbers, OPD hours)

Session status is an enum with states: `pending` → `transcribing` → `generating_soap` → `completed` | `failed`

### Authentication
- JWT access tokens with configurable expiry; refresh token endpoint for session persistence
- Passwords hashed with bcrypt
- JWT middleware/dependency protects all non-auth routes
- Tokens stored client-side in localStorage/IndexedDB with auto-refresh on 401 responses

### Audio Processing Pipeline (Two-Stage)
1. **Stage 1 — Transcription:** Base64-encoded audio sent to Gemini Flash via OpenRouter as a multimodal chat completion. System prompt instructs transcription of Hindi/Marathi/English consultations and translation to clinical English. Session status updates to `transcribing`.
2. **Stage 2 — SOAP Generation:** Transcript text sent as a follow-up completion to Gemini Flash with a structured SOAP template prompt. Response parsed as JSON with sections (Subjective, Objective, Assessment, Plan, Additional Notes). Session status updates to `generating_soap` then `completed`.

On failure: auto-retry once, then set status to `failed` with error message. Token usage (prompt + completion tokens, estimated cost) tracked per session for credit reporting.

### Frontend Architecture
- **React 18+** with JSX (no TypeScript specified in plan)
- **Zustand** for client-side state management (auth store, session store)
- **Axios** with JWT interceptor for API communication
- **vite-plugin-pwa** for service worker, manifest, and offline support
- **IndexedDB** for local recording chunk storage and resume capability
- **Web Audio API** or **FFmpeg.wasm** for client-side audio transcoding

### PDF Generation
- **WeasyPrint** converts rendered HTML to PDF
- **Jinja2** templates compose letterhead + SOAP note into a single continuous page
- Logo embedded as base64 for offline rendering reliability
- Page breaks handled for long notes

### API Design
RESTful endpoints grouped by resource: `/api/auth/*`, `/api/patients/*`, `/api/sessions/*`, `/api/notes/*` (nested under sessions), `/api/letterhead/*`, `/api/admin/*`
- Audio upload uses presigned MinIO URLs (frontend uploads directly to storage, not through API server)
- Session status polling endpoint returns enum + estimated progress

## Testing Decisions

### Testing Philosophy
Tests should verify external behavior (API responses, UI state transitions, data persistence) rather than implementation details. A good test answers "does the user-facing feature work?" not "does this internal function get called?"

### Backend Tests
- **Auth flow integration tests:** register → login → access protected route → refresh token → verify 401 on expired token
- **Patient CRUD integration tests:** create, list, search, disambiguation with name collisions
- **Session lifecycle integration tests:** create → upload audio → poll status transitions → retry failed session
- **Note editing integration tests:** save draft → edit → sign → verify signed state prevents further edits
- **PDF generation integration tests:** verify PDF output contains letterhead fields and SOAP content
- **Admin endpoint integration tests:** doctor management, invoice CRUD, credit stats aggregation
- **Audio processing tests (mocked):** mock OpenRouter API responses, test both stages, test failure scenarios (timeout, invalid response, rate limit), verify token usage tracking
- **Letterhead CRUD integration tests:** create with logo upload, update, delete logo

### Frontend Tests
- **Component unit tests:** AudioRecorder (record/stop/auto-save/resume), PatientSearch (debounce/disambiguation), SoapEditor (render/edit/save/sign states), SessionStatus (polling/error/retry), LetterheadSettings (form validation/preview)
- **E2E integration tests (Cypress/Playwright):** full new session flow, returning patient flow, letterhead setup flow, error handling/retry, PWA offline recording

### Infrastructure Tests
- **Docker Compose smoke tests:** all services start, API health checks pass, MinIO accessible, database persists across restarts

### Performance Targets
- Audio upload to completed SOAP: under 2 minutes for 20-minute audio
- PDF generation: under 5 seconds for typical note
- Concurrent polling: 50+ requests/second without degradation

## Out of Scope

- Multi-language UI localization (the app UI will be in English; only consultation audio supports multilingual)
- Patient-facing features (patient portal, patient notifications)
- Integration with hospital EMR/EHR systems
- Real-time streaming transcription (audio is recorded offline, uploaded in full)
- Voice commands or hands-free recording controls
- Mobile native apps (PWA only)
- Automated clinical coding (ICD/CPT) from SOAP notes
- Prescription generation
- Appointment scheduling
- Multi-clinic or multi-organization support (single-tenant platform)
- Custom SOAP template configuration by doctors
- Export to HL7 FHIR or other healthcare data standards
- Billing/payment gateway integration (invoices are admin-managed, not self-service)
- HIPAA/GDPR compliance tooling (basic data isolation per doctor is in scope; formal compliance certification is not)
- Audit logging of all data access events
- Two-factor authentication
- Password reset flow
- Email notifications
- Rate limiting per doctor on recording uploads (only API credit rate limiting in admin)

## Further Notes

### Domain Glossary

| Term | Definition |
|---|---|
| **Doctor** | Platform user; a physician who records consultations and manages SOAP notes |
| **Patient** | A person being consulted; scoped per doctor (same person can exist under different doctors) |
| **Session** | One audio recording + its full processing pipeline (upload, transcription, SOAP generation) |
| **Note** | The SOAP note generated from a session; editable, signable, PDF-exportable |
| **SOAP** | Subjective, Objective, Assessment, Plan — standard clinical note format |
| **Letterhead** | Per-doctor PDF template configuration (logo, clinic name, qualifications, address, etc.) |
| **Invoice** | Billing record per doctor (amount, currency, period, status) |
| **Credit tracking** | Per-doctor OpenRouter API token usage and cost estimation |
| **Transcription** | Stage 1 pipeline: audio → English transcript via Gemini Flash multimodal |
| **SOAP generation** | Stage 2 pipeline: transcript → structured SOAP JSON via Gemini Flash text completion |
| **Presigned URL** | MinIO-generated time-limited URL for direct audio upload from frontend to storage |
| **Signed note** | A finalized, locked SOAP note where the doctor attests to its accuracy |
| **Disambiguation** | UI flow when patient name search returns multiple matches; user must select the correct one |

### Existing Prototype Context
The existing `transcribe.py` script demonstrates the core AI pipeline works: Gemini Flash via OpenRouter successfully transcribes Hindi/Marathi pediatric surgery consultations and generates structured SOAP notes. Three sample outputs exist from July 6, 2026 (hypospadias follow-up, scrotal asymmetry, Hirschsprung disease follow-up). This prototype validates the approach but all web infrastructure, persistence, and multi-user support needs to be built from scratch.

### Seam Location
The primary testing seam is the **Session processing pipeline boundary** — the async Celery worker that receives a `session_id`, orchestrates transcription and SOAP generation, and writes results to the Note table. This single seam covers:
- Audio ingestion (MinIO download)
- AI model interaction (OpenRouter calls)
- Status transitions (enum state machine)
- Error handling and retry
- Token usage tracking
- Note persistence

A secondary seam is the **API route layer** where auth, patient management, session management, note editing, and admin endpoints can be tested as HTTP request/response contracts independent of the processing pipeline.
