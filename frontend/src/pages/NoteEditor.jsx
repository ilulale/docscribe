import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getNote,
  updateNote,
  signNote,
  regenerateNote,
  getSession,
} from "../api/endpoints";

const SECTIONS = [
  { key: "subjective", label: "Subjective", placeholder: "Chief Complaint, HPI, PMH, Medications, Allergies..." },
  { key: "objective", label: "Objective", placeholder: "Vitals, Physical Exam, Investigations..." },
  { key: "assessment", label: "Assessment", placeholder: "Diagnosis, Differential Diagnosis..." },
  { key: "plan", label: "Plan", placeholder: "Treatment Plan, Medications, Follow-up..." },
  { key: "additional_notes", label: "Additional Notes", placeholder: "Any other notes..." },
];

function SoapSection({ field, label, placeholder, value, onChange, readOnly }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <span>{label}</span>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="p-4">
          <textarea
            value={value || ""}
            onChange={(e) => onChange(field, e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              readOnly ? "bg-gray-50 cursor-default" : ""
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
      const updated = await updateNote(sessionId, { soap_json: soap, transcript });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading note...</div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SOAP Note</h1>
          {session && (
            <p className="text-sm text-gray-500">
              Session {sessionId} — {session.patient_name || `Patient #${session.patient_id}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isSigned && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              Signed
            </span>
          )}
          <Link
            to={`/sessions/${sessionId}`}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
          >
            Session Status
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Draft saved
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>{showTranscript ? "▼" : "▶"}</span>
          Transcript Reference
        </button>
        {showTranscript && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {transcript || "No transcript available."}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <SoapSection
            key={s.key}
            field={s.key}
            label={s.label}
            placeholder={s.placeholder}
            value={soap[s.key]}
            onChange={handleFieldChange}
            readOnly={isSigned}
          />
        ))}
      </div>

      {!isSigned && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setShowSignConfirm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Review & Sign
          </button>
        </div>
      )}

      {isSigned && (
        <div className="flex gap-3 justify-end">
          <Link
            to={`/sessions/${sessionId}/note/pdf`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
          >
            Download PDF
          </Link>
        </div>
      )}

      {showSignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Sign this note?</h3>
            <p className="text-gray-600 mb-4">
              Once signed, this note cannot be edited. A signed PDF will be
              generated for download.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSignConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {signing ? "Signing..." : "Sign & Finalize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
