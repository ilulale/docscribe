import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getPatient,
  getPatientSessions,
  retrySession,
} from "../api/endpoints";

const STATUS_CONFIG = {
  completed: { badge: "badge-success", label: "Done" },
  pending: { badge: "badge-warning", label: "Pending" },
  transcribing: { badge: "badge-info", label: "Transcribing" },
  generating_soap: { badge: "badge-info", label: "Generating" },
  failed: { badge: "badge-danger", label: "Failed" },
};

export default function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [patientData, sessionsData] = await Promise.all([
          getPatient(id),
          getPatientSessions(id),
        ]);
        setPatient(patientData);
        setSessions(sessionsData);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load patient");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleRetry = useCallback(
    async (e, sessionId) => {
      e.preventDefault();
      setRetryingId(sessionId);
      try {
        await retrySession(sessionId);
        navigate(`/sessions/${sessionId}`);
      } catch {
        /* silently fail */
      }
      setRetryingId(null);
    },
    [navigate]
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );

  if (error)
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
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center text-lg font-bold text-accent">
          {patient?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{patient?.name}</h1>
          <p className="text-sm text-muted">Patient #{id}</p>
        </div>
      </div>

      <h2 className="section-title">Session History</h2>

      {sessions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No sessions found for this patient.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session, i) => {
            const config =
              STATUS_CONFIG[session.status] || STATUS_CONFIG.completed;
            return (
              <div
                key={session.id}
                className="card-hover px-5 py-3.5 flex items-center justify-between cursor-pointer opacity-0 animate-slide-up"
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() =>
                  navigate(
                    session.status === "completed"
                      ? `/sessions/${session.id}/note`
                      : `/sessions/${session.id}`
                  )
                }
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-0/5 flex items-center justify-center text-2xs font-bold text-muted shrink-0">
                    {String(session.id).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      Session #{session.id}
                    </div>
                    <div className="text-2xs text-muted">
                      {new Date(session.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {session.status === "failed" && (
                    <button
                      onClick={(e) => handleRetry(e, session.id)}
                      disabled={retryingId === session.id}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {retryingId === session.id ? "Retrying..." : "Retry"}
                    </button>
                  )}
                  <span className={config.badge}>{config.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
