import { useState, useEffect } from "react";
import { getCredits } from "../../api/endpoints";

const USD_TO_INR = 85;

const PRICING = {
  prompt_per_1m: 0.075,
  completion_per_1m: 0.30,
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
      return inr < 1 ? `₹${inr.toFixed(4)}` : `₹${inr.toFixed(2)}`;
    }
    return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
  }

  const sorted = [...credits].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortBy === "estimated_cost") {
      const aCost = calcCostUsd(a.total_prompt_tokens, a.total_completion_tokens);
      const bCost = calcCostUsd(b.total_prompt_tokens, b.total_completion_tokens);
      return (aCost - bCost) * mult;
    }
    return ((a[sortBy] || 0) - (b[sortBy] || 0)) * mult;
  });

  const totalCost = credits.reduce(
    (sum, c) => sum + calcCostUsd(c.total_prompt_tokens, c.total_completion_tokens),
    0
  );

  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Credit Usage</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrency("inr")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currency === "inr"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            INR
          </button>
          <button
            onClick={() => setCurrency("usd")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currency === "usd"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            USD
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Gemini Flash Lite pricing: prompt $0.075/1M, completion $0.30/1M
          </span>
          <span className="font-medium text-gray-700">
            Total: {formatCost(totalCost)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 mt-4">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Doctor
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("total_sessions")}
                >
                  Sessions
                  <SortIndicator field="total_sessions" />
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("total_prompt_tokens")}
                >
                  Prompt Tokens
                  <SortIndicator field="total_prompt_tokens" />
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("total_completion_tokens")}
                >
                  Completion Tokens
                  <SortIndicator field="total_completion_tokens" />
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Total Tokens
                </th>
                <th
                  className="text-right px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("estimated_cost")}
                >
                  Est. Cost
                  <SortIndicator field="estimated_cost" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((c) => (
                <tr key={c.doctor_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.doctor_name}</td>
                  <td className="px-4 py-3">{c.total_sessions}</td>
                  <td className="px-4 py-3">{c.total_prompt_tokens.toLocaleString()}</td>
                  <td className="px-4 py-3">{c.total_completion_tokens.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">
                    {(c.total_prompt_tokens + c.total_completion_tokens).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCost(
                      calcCostUsd(c.total_prompt_tokens, c.total_completion_tokens)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credits.length === 0 && (
            <div className="p-6 text-gray-500 text-center">No data yet</div>
          )}
        </div>
      )}
    </div>
  );
}
