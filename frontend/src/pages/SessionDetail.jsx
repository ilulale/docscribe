import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSession, getSessionStatus, retrySession } from "../api/endpoints";

const STEPS = [
  { key: "pending", label: "Uploaded" },
  { key: "transcribing", label: "Transcribing" },
  { key: "generating_soap", label: "Generating SOAP" },
  { key: "completed", label: "Done" },
];

const PROGRESS_LABELS = {
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

      const timer = setInterval(async () => {
        const shouldContinue = await poll();
        if (!shouldContinue) clearInterval(timer);
      }, 3000);
    } catch (e) {
      setError(e.response?.data?.detail || "Retry failed");
    }
    setRetrying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading session...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Session {id}</h1>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">
            Processing Status
          </h2>

          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((step, i) => {
              const isDone = i < currentIdx || isCompleted;
              const isCurrent = i === currentIdx && !isCompleted && !isFailed;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-2 rounded-full mb-2 ${
                      isDone
                        ? "bg-green-500"
                        : isCurrent
                          ? "bg-blue-500 animate-pulse"
                          : "bg-gray-200"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isCurrent ? "text-blue-600 font-medium" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            {isFailed ? (
              <div className="space-y-3">
                <p className="text-red-600 font-medium">
                  {session?.error_message || "Processing failed"}
                </p>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {retrying ? "Retrying..." : "Retry"}
                </button>
              </div>
            ) : isCompleted ? (
              <div className="space-y-3">
                <p className="text-green-600 font-medium">
                  Processing complete!
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to note editor...
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                {PROGRESS_LABELS[status] || "Processing..."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Session ID</dt>
              <dd className="font-mono">{id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Patient</dt>
              <dd>{session?.patient_name || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{session?.created_at ? new Date(session.created_at).toLocaleString() : "N/A"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
