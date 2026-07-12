import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPatient, getPatientSessions, retrySession } from "../api/endpoints";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  transcribing: "bg-blue-100 text-blue-700",
  generating_soap: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
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

  const handleRetry = useCallback(async (e, sessionId) => {
    e.preventDefault();
    setRetryingId(sessionId);
    try {
      await retrySession(sessionId);
      navigate(`/sessions/${sessionId}`);
    } catch {
      // silently fail
    }
    setRetryingId(null);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
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
      <div>
        <h1 className="text-2xl font-bold">{patient?.name}</h1>
        <p className="text-sm text-gray-500">Patient #{id}</p>
      </div>

      <h2 className="text-lg font-semibold">Session History</h2>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">
          No sessions found for this patient.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    navigate(
                      session.status === "completed"
                        ? `/sessions/${session.id}/note`
                        : `/sessions/${session.id}`
                    )
                  }
                >
                  <div className="font-medium">Session #{session.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(session.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.status === "failed" && (
                    <button
                      onClick={(e) => handleRetry(e, session.id)}
                      disabled={retryingId === session.id}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {retryingId === session.id ? "Retrying..." : "Retry"}
                    </button>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_STYLES[session.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {session.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
