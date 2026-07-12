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
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Doctors", value: stats?.total_doctors ?? 0 },
    { label: "Sessions Today", value: stats?.sessions_today ?? 0, accent: true },
    { label: "Total Sessions", value: stats?.total_sessions ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Stats</h1>
        <p className="text-sm text-muted mt-0.5">Platform overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className={`card px-5 py-5 opacity-0 animate-slide-up stagger-${i + 1}`}
          >
            <p className="text-2xs font-medium uppercase tracking-wider text-muted mb-2">
              {card.label}
            </p>
            <p
              className={`text-4xl font-bold tabular-nums ${
                card.accent ? "text-accent" : ""
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
