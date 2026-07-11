import { useState, useEffect } from "react";
import { getCredits } from "../../api/endpoints";

export default function CreditsPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("total_sessions");
  const [sortDir, setSortDir] = useState("desc");

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

  const sorted = [...credits].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * mult;
  });

  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Credit Usage</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
