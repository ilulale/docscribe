import { useState, useEffect } from "react";
import { getCredits } from "../../api/endpoints";

const USD_TO_INR = 85;

const PRICING = {
  prompt_per_1m: 0.075,
  completion_per_1m: 0.3,
};

function calcCostUsd(promptTokens, completionTokens) {
  return (
    (promptTokens / 1_000_000) * PRICING.prompt_per_1m +
    (completionTokens / 1_000_000) * PRICING.completion_per_1m
  );
}

export default function CreditsPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("total_sessions");
  const [sortDir, setSortDir] = useState("desc");
  const [currency, setCurrency] = useState("inr");

  useEffect(() => {
    async function load() {
      try {
        const data = await getCredits();
        setCredits(data.doctors || []);
      } catch {
        setError("Failed to load credits");
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function formatCost(usd) {
    if (currency === "inr") {
      const inr = usd * USD_TO_INR;
      return inr < 1 ? `\u20B9${inr.toFixed(4)}` : `\u20B9${inr.toFixed(2)}`;
    }
    return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
  }

  const sorted = [...credits].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortBy === "estimated_cost") {
      const aCost = calcCostUsd(
        a.total_prompt_tokens,
        a.total_completion_tokens
      );
      const bCost = calcCostUsd(
        b.total_prompt_tokens,
        b.total_completion_tokens
      );
      return (aCost - bCost) * mult;
    }
    return ((a[sortBy] || 0) - (b[sortBy] || 0)) * mult;
  });

  const totalCost = credits.reduce(
    (sum, c) =>
      sum +
      calcCostUsd(c.total_prompt_tokens, c.total_completion_tokens),
    0
  );

  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return <span className="ml-1">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
          <p className="text-sm text-muted mt-0.5">
            Token usage and estimated costs
          </p>
        </div>
        <div className="flex items-center gap-1 bg-surface-0/5 rounded-lg p-0.5">
          <button
            onClick={() => setCurrency("inr")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              currency === "inr"
                ? "bg-white shadow-sm text-surface-0"
                : "text-muted hover:text-surface-0"
            }`}
          >
            INR
          </button>
          <button
            onClick={() => setCurrency("usd")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              currency === "usd"
                ? "bg-white shadow-sm text-surface-0"
                : "text-muted hover:text-surface-0"
            }`}
          >
            USD
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      <div className="card p-4 flex items-center justify-between animate-slide-up">
        <span className="text-2xs text-muted">
          Gemini Flash Lite: prompt $0.075/1M, completion $0.30/1M
        </span>
        <span className="text-sm font-semibold tabular-nums">
          Total: {formatCost(totalCost)}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="card overflow-hidden animate-slide-up stagger-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: "doctor_name", label: "Doctor" },
                  { key: "total_sessions", label: "Sessions" },
                  { key: "total_prompt_tokens", label: "Prompt Tokens" },
                  {
                    key: "total_completion_tokens",
                    label: "Completion Tokens",
                  },
                  { key: null, label: "Total" },
                  { key: "estimated_cost", label: "Est. Cost" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted ${
                      col.key
                        ? "cursor-pointer hover:text-surface-0 transition-colors"
                        : ""
                    } ${col.key === "estimated_cost" ? "text-right" : "text-left"}`}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                  >
                    {col.label}
                    {col.key && <SortIndicator field={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c) => (
                <tr
                  key={c.doctor_id}
                  className="hover:bg-canvas transition-colors duration-100"
                >
                  <td className="px-5 py-3.5 text-sm font-medium">
                    {c.doctor_name}
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums">
                    {c.total_sessions}
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums">
                    {c.total_prompt_tokens.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums">
                    {c.total_completion_tokens.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium tabular-nums">
                    {(
                      c.total_prompt_tokens + c.total_completion_tokens
                    ).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium tabular-nums text-right">
                    {formatCost(
                      calcCostUsd(
                        c.total_prompt_tokens,
                        c.total_completion_tokens
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credits.length === 0 && (
            <div className="p-8 text-center text-sm text-muted">No data yet</div>
          )}
        </div>
      )}
    </div>
  );
}
