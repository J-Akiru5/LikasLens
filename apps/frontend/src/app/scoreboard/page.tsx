"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  eco_credits?: number;
};

export default function ScoreboardPage() {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
        const res = await fetch(`${laravelUrl}/api/leaderboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setData(json.data ?? json);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Unable to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Public Scoreboard</h1>

        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded">{error}</div>
        ) : (
          <ol className="space-y-3">
            {data && data.length ? (
              data.map((u, idx) => (
                <li key={u.id} className="p-4 bg-white rounded shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium">{idx + 1}. {u.name}</div>
                    <div className="text-xs text-gray-500">Eco Credits: {u.eco_credits ?? u.score}</div>
                  </div>
                  <div className="text-lg font-semibold text-green-700">{u.eco_credits ?? u.score}</div>
                </li>
              ))
            ) : (
              <div className="p-4 text-gray-600">No leaderboard entries yet.</div>
            )}
          </ol>
        )}
      </div>
    </main>
  );
}
