import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSession, getSessionStatus, retrySession } from "../api/endpoints";

const STEPS = [
  { key: "pending", label: "Uploaded" },
  { key: "transcribing", label: "Transcribing" },
  { key: "generating_soap", label: "Generating" },
  { key: "completed", label: "Done" },
];

const PROGRESS_MESSAGES = {
  pending: "Uploading audio...",
  transcribing: "Transcribing audio...",
  generating_soap: "Generating SOAP note...",
  completed: "Processing complete!",
};

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const poll = useCallback(async () => {
    try {
      const status = await getSessionStatus(id);
      setSession((prev) => ({ ...prev, ...status }));
      if (status.status === "completed") {
        navigate(`/sessions/${id}/note`);
        return false;
      }
      if (status.status === "failed") return false;
      return true;
    } catch {
      return false;
    }
  }, [id, navigate]);

  useEffect(() => {
    let timer;
    let active = true;
    async function init() {
      try {
        const data = await getSession(id);
        setSession(data);
        setLoading(false);
        if (data.status !== "completed" && data.status !== "failed") {
          timer = setInterval(async () => {
            if (!active) return;
            const shouldContinue = await poll();
            if (!shouldContinue && active) clearInterval(timer);
          }, 3000);
        }
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load session");
        setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [id, poll]);

  async function handleRetry() {
    setRetrying(true);
    setError("");
    try {
      const data = await retrySession(id);
      setSession((prev) => ({ ...prev, ...data }));
      const retryTimer = setInterval(async () => {
        const shouldContinue = await poll();
        if (!shouldContinue) clearInterval(retryTimer);
      }, 3000);
    } catch (e) {
      setError(e.response?.data?.detail || "Retry failed");
    }
    setRetrying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading session...
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Link to="/" className="btn-secondary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const status = session?.status || "pending";
  const isFailed = status === "failed";
  const isCompleted = status === "completed";
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Session {id}</h1>
        <p className="text-sm text-muted mt-0.5">
          {session?.patient_name || `Patient #${session?.patient_id}`}
        </p>
      </div>

      <div className="card p-6 animate-slide-up">
        <p className="section-title mb-5">Processing Status</p>

        <div className="flex items-end gap-1 mb-6">
          {STEPS.map((step, i) => {
            const isDone = i < currentIdx || isCompleted;
            const isCurrent = i === currentIdx && !isCompleted && !isFailed;
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

        <div className="text-center py-4">
          {isFailed ? (
            <div className="space-y-3">
              <p className="text-red-500 text-sm font-medium">
                {session?.error_message || "Processing failed"}
              </p>
              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="btn-primary"
              >
                {retrying ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Retrying...
                  </span>
                ) : (
                  "Retry"
                )}
              </button>
            </div>
          ) : isCompleted ? (
            <div className="space-y-1">
              <p className="text-accent font-medium text-sm">
                Processing complete
              </p>
              <p className="text-xs text-muted">
                Redirecting to note editor...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <span className="w-3.5 h-3.5 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
              {PROGRESS_MESSAGES[status] || "Processing..."}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 animate-slide-up stagger-2">
        <p className="section-title mb-4">Details</p>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Session ID</dt>
            <dd className="font-mono text-2xs">{id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Patient</dt>
            <dd>{session?.patient_name || "N/A"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Created</dt>
            <dd>
              {session?.created_at
                ? new Date(session.created_at).toLocaleString()
                : "N/A"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
