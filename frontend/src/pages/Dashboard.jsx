import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Dashboard() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
      <div className="bg-white rounded-lg shadow p-6 text-gray-500">
        No sessions yet. Start by recording a consultation.
      </div>
    </div>
  );
}
