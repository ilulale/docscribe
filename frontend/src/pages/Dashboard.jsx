import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { listSessions, retrySession } from "../api/endpoints";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  transcribing: "bg-blue-100 text-blue-700",
  generating_soap: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    async function load() {
      try {
        const allSessions = await listSessions({ pageSize: 50 });
        setSessions(allSessions.slice(0, 10));

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const today = allSessions.filter(
          (s) => new Date(s.created_at) >= todayStart
        ).length;
        const pending = allSessions.filter(
          (s) => s.status === "pending" || s.status === "transcribing" || s.status === "generating_soap"
        ).length;
        setStats({ today, pending, total: allSessions.length });
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleRetry = useCallback(async (e, sessionId) => {
    e.preventDefault();
    setRetryingId(sessionId);
    try {
      await retrySession(sessionId);
      navigate(`/sessions/${sessionId}`);
    } catch {
      // silently fail — user can retry from session detail
    }
    setRetryingId(null);
  }, [navigate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          to="/sessions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Recording
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Today's Sessions</p>
          <p className="text-3xl font-bold">{loading ? "-" : stats.today}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold">{loading ? "-" : stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-3xl font-bold">{loading ? "-" : stats.total}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">
          No sessions yet. Start by recording a consultation.
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
