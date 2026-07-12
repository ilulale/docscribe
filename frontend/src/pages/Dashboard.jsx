import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { listSessions, retrySession } from "../api/endpoints";

const STATUS_CONFIG = {
  completed: { badge: "badge-success", label: "Done" },
  pending: { badge: "badge-warning", label: "Pending" },
  transcribing: { badge: "badge-info", label: "Transcribing" },
  generating_soap: { badge: "badge-info", label: "Generating" },
  failed: { badge: "badge-danger", label: "Failed" },
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
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const today = allSessions.filter(
          (s) => new Date(s.created_at) >= todayStart
        ).length;
        const pending = allSessions.filter(
          (s) =>
            s.status === "pending" ||
            s.status === "transcribing" ||
            s.status === "generating_soap"
        ).length;
        setStats({ today, pending, total: allSessions.length });
      } catch {
        /* silently fail */
      }
      setLoading(false);
    }
    load();
  }, []);

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

  const statCards = [
    { label: "Today", value: stats.today },
    { label: "Processing", value: stats.pending },
    { label: "Total", value: stats.total },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            Your consultation overview
          </p>
        </div>
        <Link to="/sessions/new" className="btn-primary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          New Recording
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`card px-5 py-4 opacity-0 animate-slide-up stagger-${i + 1}`}
          >
            <p className="text-2xs font-medium uppercase tracking-wider text-muted">
              {card.label}
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              {loading ? (
                <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-shimmer" />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-4">Recent Sessions</h2>

        {loading ? (
          <div className="card p-8 text-center text-sm text-muted">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <p className="text-sm text-muted">
              No sessions yet. Start by recording a consultation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, i) => {
              const config =
                STATUS_CONFIG[session.status] || STATUS_CONFIG.completed;
              return (
                <div
                  key={session.id}
                  className={`card-hover px-5 py-3.5 flex items-center justify-between cursor-pointer opacity-0 animate-slide-up`}
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
                        {new Date(session.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
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
                        {retryingId === session.id
                          ? "Retrying..."
                          : "Retry"}
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
    </div>
  );
}
