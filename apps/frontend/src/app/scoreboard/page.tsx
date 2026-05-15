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
    <main>
      <h1>Public Scoreboard</h1>

      {loading ? (
        <ul>
          <li>Loading...</li>
          <li>Loading...</li>
          <li>Loading...</li>
        </ul>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ol>
          {data && data.length ? (
            data.map((u, idx) => (
              <li key={u.id}>
                {idx + 1}. {u.name} - Eco Credits: {u.eco_credits ?? u.score}
              </li>
            ))
          ) : (
            <li>No leaderboard entries yet.</li>
          )}
        </ol>
      )}
    </main>
  );
}
