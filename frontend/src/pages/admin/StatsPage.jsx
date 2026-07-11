import { useState, useEffect } from "react";
import { getStats } from "../../api/endpoints";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getStats();
        setStats(data);
      } catch {
        setError("Failed to load stats");
      }
      setLoading(false);
    }
    load();
  }, []);

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
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Stats</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Doctors</p>
          <p className="text-4xl font-bold text-gray-800">{stats?.total_doctors ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Sessions Today</p>
          <p className="text-4xl font-bold text-blue-600">{stats?.sessions_today ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
          <p className="text-4xl font-bold text-gray-800">{stats?.total_sessions ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
