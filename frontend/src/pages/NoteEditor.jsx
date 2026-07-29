import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getNote,
  updateNote,
  signNote,
  regenerateNote,
  getSession,
  getSessionAudioUrl,
  getSessionStatus,
  reprocessSession,
} from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";

const STEPS = [
  { key: "pending", label: "Uploaded" },
  { key: "transcribing", label: "Transcribing" },
  { key: "generating_soap", label: "Generating" },
  { key: "completed", label: "Done" },
];

const PROGRESS_MESSAGES = {
  pending: "Preparing audio...",
  transcribing: "Transcribing audio...",
  generating_soap: "Generating SOAP note...",
  completed: "Processing complete!",
};

const FALLBACK_SECTIONS = [
  {
    key: "subjective",
    label: "Subjective",
    prompt_instructions: "Chief Complaint, HPI, PMH, Medications, Allergies...",
  },
  {
    key: "objective",
    label: "Objective",
    prompt_instructions: "Vitals, Physical Exam, Investigations...",
  },
  {
    key: "assessment",
    label: "Assessment",
    prompt_instructions: "Diagnosis, Differential Diagnosis...",
  },
  {
    key: "plan",
    label: "Plan",
    prompt_instructions: "Treatment Plan, Medications, Follow-up...",
  },
  {
    key: "additional_notes",
    label: "Additional Notes",
    prompt_instructions: "Any other notes...",
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
            className={`w-full px-4 py-3 rounded-xl text-sm bg-canvas border border-border resize-y focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-150 min-h-[280px] ${
              readOnly ? "bg-surface-0/3 cursor-default" : ""
            }`}
          />
        </div>
      )}
    </div>
  );
}

function keyToLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NoteEditor() {
  const { id: sessionId } = useParams();
  const doctor = useAuthStore((s) => s.doctor);
  const isAdmin = doctor?.is_admin;
  const [note, setNote] = useState(null);
  const [soap, setSoap] = useState({});
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessStatus, setReprocessStatus] = useState(null);
  const [showReprocessConfirm, setShowReprocessConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [session, setSession] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const autoSaveRef = useRef(null);
  const pollRef = useRef(null);
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
        setAudioUrl(getSessionAudioUrl(sessionId));
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

  async function handleReprocess() {
    setShowReprocessConfirm(false);
    setReprocessing(true);
    setReprocessStatus("pending");
    setError("");
    try {
      await reprocessSession(sessionId);
      pollRef.current = setInterval(async () => {
        try {
          const status = await getSessionStatus(sessionId);
          setReprocessStatus(status.status);
          if (status.status === "completed") {
            clearInterval(pollRef.current);
            setReprocessStatus(null);
            const [noteData, sessionData] = await Promise.all([
              getNote(sessionId),
              getSession(sessionId),
            ]);
            setNote(noteData);
            setSoap(noteData.soap_json || {});
            setTranscript(noteData.transcript || "");
            setSession(sessionData);
            setReprocessing(false);
          } else if (status.status === "failed") {
            clearInterval(pollRef.current);
            setReprocessStatus(null);
            setError(status.error_message || "Reprocessing failed");
            setReprocessing(false);
          }
        } catch {
          clearInterval(pollRef.current);
          setReprocessStatus(null);
          setError("Polling failed");
          setReprocessing(false);
        }
      }, 3000);
    } catch (e) {
      setError(e.response?.data?.detail || "Reprocess failed");
      setReprocessing(false);
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">SOAP Note</h1>
          <p className="text-sm text-muted mt-0.5 truncate">
            Session {session?.sequence_number ?? sessionId} &mdash;{" "}
            {session?.patient_name || `Patient #${session?.patient_id}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSigned && <span className="badge-success">Signed</span>}
          <Link
            to={`/sessions/${sessionId}`}
            className="btn-ghost text-xs"
          >
            Status
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
            <div className="text-sm text-surface-0/70 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {transcript || "No transcript available."}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {(Object.keys(soap).length > 0
          ? Object.keys(soap).map((key) => ({
              key,
              label: keyToLabel(key),
            }))
          : FALLBACK_SECTIONS
        ).map((s, i) => (
          <div
            key={s.key}
            className="opacity-0 animate-slide-up"
            style={{ animationDelay: `${(i + 1) * 0.04}s` }}
          >
            <SoapSection
              field={s.key}
              label={s.label}
              placeholder={`Enter ${s.label}...`}
              value={soap[s.key] || ""}
              onChange={handleFieldChange}
              readOnly={isSigned}
            />
          </div>
        ))}
      </div>

      {!isSigned && (
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary text-xs sm:text-sm"
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
          {isAdmin && (
            <button
              onClick={() => setShowReprocessConfirm(true)}
              disabled={reprocessing}
              className="btn-secondary text-xs sm:text-sm"
            >
              {reprocessing ? "Reprocessing..." : "Reprocess"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary text-xs sm:text-sm"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setShowSignConfirm(true)}
            className="btn-primary text-xs sm:text-sm"
          >
            Review & Sign
          </button>
        </div>
      )}

      {isSigned && (
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          {isAdmin && (
            <button
              onClick={() => setShowReprocessConfirm(true)}
              disabled={reprocessing}
              className="btn-secondary text-xs sm:text-sm"
            >
              {reprocessing ? "Reprocessing..." : "Reprocess"}
            </button>
          )}
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
              const dateStr = session?.created_at?.split("T")[0] || "";
              a.download = `${session?.patient_name || sessionId}-${dateStr}-notes.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-primary text-xs sm:text-sm"
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

      {reprocessing && (
        <div className="card p-6 animate-slide-up">
          <p className="section-title mb-5">Reprocessing with current model</p>
          <div className="flex items-end gap-1 mb-6">
            {STEPS.map((step, i) => {
              const currentIdx = STEPS.findIndex((s) => s.key === (reprocessStatus || "pending"));
              const isDone = i < currentIdx;
              const isCurrent = i === currentIdx && reprocessStatus !== "completed";
              return (
                <div key={step.key} className="flex-1 flex flex-col gap-2">
                  <div className="relative h-1.5 rounded-full overflow-hidden bg-surface-0/5">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                        isDone
                          ? "bg-accent w-full"
                          : isCurrent
                          ? "bg-accent w-2/3 animate-shimmer"
                          : "w-0"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-2xs ${
                      isCurrent
                        ? "text-accent font-medium"
                        : isDone
                        ? "text-surface-0/60"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <span className="w-3.5 h-3.5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
            {PROGRESS_MESSAGES[reprocessStatus] || "Processing..."}
          </div>
        </div>
      )}

      {showReprocessConfirm && (
        <div className="fixed inset-0 bg-surface-0/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lift-lg animate-scale-in">
            <h3 className="text-lg font-semibold mb-1">Reprocess this note?</h3>
            <p className="text-sm text-muted mb-5">
              This will re-run transcription and SOAP generation using the
              doctor's current AI model. The existing note will be replaced
              and unsigned.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReprocessConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReprocess}
                className="btn-primary"
              >
                Reprocess
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
