import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getNote,
  updateNote,
  signNote,
  regenerateNote,
  getSession,
  getSessionAudioUrl,
} from "../api/endpoints";

const SECTIONS = [
  {
    key: "subjective",
    label: "Subjective",
    placeholder: "Chief Complaint, HPI, PMH, Medications, Allergies...",
  },
  {
    key: "objective",
    label: "Objective",
    placeholder: "Vitals, Physical Exam, Investigations...",
  },
  {
    key: "assessment",
    label: "Assessment",
    placeholder: "Diagnosis, Differential Diagnosis...",
  },
  {
    key: "plan",
    label: "Plan",
    placeholder: "Treatment Plan, Medications, Follow-up...",
  },
  {
    key: "additional_notes",
    label: "Additional Notes",
    placeholder: "Any other notes...",
  },
];

function SoapSection({ field, label, placeholder, value, onChange, readOnly }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left group"
      >
        <span className="text-sm font-medium">{label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-muted transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-0">
          <textarea
            value={value || ""}
            onChange={(e) => onChange(field, e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder}
            rows={8}
            className={`w-full px-4 py-3 rounded-xl text-sm bg-canvas border border-border resize-y focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-150 min-h-[180px] ${
              readOnly ? "bg-surface-0/3 cursor-default" : ""
            }`}
          />
        </div>
      )}
    </div>
  );
}

export default function NoteEditor() {
  const { id: sessionId } = useParams();
  const [note, setNote] = useState(null);
  const [soap, setSoap] = useState({});
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [session, setSession] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const autoSaveRef = useRef(null);
  const isSigned = note?.is_signed;

  useEffect(() => {
    async function load() {
      try {
        const [noteData, sessionData] = await Promise.all([
          getNote(sessionId),
          getSession(sessionId),
        ]);
        setNote(noteData);
        setSoap(noteData.soap_json || {});
        setTranscript(noteData.transcript || "");
        setSession(sessionData);
        getSessionAudioUrl(sessionId)
          .then((url) => setAudioUrl(url))
          .catch(() => {});
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load note");
      }
      setLoading(false);
    }
    load();
  }, [sessionId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateNote(sessionId, {
        soap_json: soap,
        transcript,
      });
      setNote(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  }, [sessionId, soap, transcript]);

  useEffect(() => {
    if (isSigned) return;
    autoSaveRef.current = setInterval(() => {
      if (note) handleSave();
    }, 60000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [isSigned, note, handleSave]);

  function handleFieldChange(field, value) {
    setSoap((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSign() {
    setSigning(true);
    setError("");
    try {
      const updated = await signNote(sessionId);
      setNote(updated);
      setShowSignConfirm(false);
    } catch (e) {
      setError(e.response?.data?.detail || "Sign failed");
    }
    setSigning(false);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError("");
    try {
      const updated = await regenerateNote(sessionId);
      setNote(updated);
      setSoap(updated.soap_json || {});
    } catch (e) {
      setError(e.response?.data?.detail || "Regeneration failed");
    }
    setRegenerating(false);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading note...
        </div>
      </div>
    );

  if (error && !note)
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Link to="/" className="btn-secondary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SOAP Note</h1>
          <p className="text-sm text-muted mt-0.5">
            Session {sessionId} &mdash;{" "}
            {session?.patient_name || `Patient #${session?.patient_id}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSigned && <span className="badge-success">Signed</span>}
          <Link
            to={`/sessions/${sessionId}`}
            className="btn-ghost text-xs"
          >
            Session Status
          </Link>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {saved && (
        <div className="px-4 py-3 rounded-xl bg-accent-muted border border-accent-light text-accent text-xs animate-slide-up">
          Draft saved
        </div>
      )}

      <div className="card overflow-hidden animate-slide-up stagger-1">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Recording & Transcript
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-muted transition-transform duration-200 ${
              showTranscript ? "" : "-rotate-90"
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showTranscript && (
          <div className="px-5 pb-5 space-y-4 animate-slide-up">
            {audioUrl && (
              <div className="bg-canvas rounded-xl p-4">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full h-10 [&::-webkit-media-controls-panel]:bg-surface-0/5 [&::-webkit-media-controls-panel]:rounded-lg"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}
            {!audioUrl && (
              <div className="bg-canvas rounded-xl p-4 flex items-center gap-2 text-xs text-muted">
                <span className="w-3.5 h-3.5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                Loading audio...
              </div>
            )}
            <div className="text-sm text-surface-0/70 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {transcript || "No transcript available."}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s, i) => (
          <div
            key={s.key}
            className="opacity-0 animate-slide-up"
            style={{ animationDelay: `${(i + 1) * 0.04}s` }}
          >
            <SoapSection
              field={s.key}
              label={s.label}
              placeholder={s.placeholder}
              value={soap[s.key]}
              onChange={handleFieldChange}
              readOnly={isSigned}
            />
          </div>
        ))}
      </div>

      {!isSigned && (
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary"
          >
            {regenerating ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                Regenerating...
              </span>
            ) : (
              "Regenerate"
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setShowSignConfirm(true)}
            className="btn-primary"
          >
            Review & Sign
          </button>
        </div>
      )}

      {isSigned && (
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={async () => {
              const token = localStorage.getItem("token");
              const resp = await fetch(`/api/sessions/${sessionId}/note/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!resp.ok) return;
              const blob = await resp.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `note_${sessionId}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-primary"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>
      )}

      {showSignConfirm && (
        <div className="fixed inset-0 bg-surface-0/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lift-lg animate-scale-in">
            <h3 className="text-lg font-semibold mb-1">Sign this note?</h3>
            <p className="text-sm text-muted mb-5">
              Once signed, this note cannot be edited. A signed PDF will be
              generated for download.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSignConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="btn-primary"
              >
                {signing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing...
                  </span>
                ) : (
                  "Sign & Finalize"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
