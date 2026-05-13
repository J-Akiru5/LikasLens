import type { ScoreboardRow } from "@/lib/mock-data";

type PublicScoreboardProps = {
  rows: ScoreboardRow[];
  showOpenCases?: boolean;
};

export function PublicScoreboard({ rows, showOpenCases = false }: PublicScoreboardProps) {
  return (
    <div className="grid gap-3">
      <div
        className={`font-data hidden rounded-md border px-3 py-2 text-xs uppercase tracking-[0.12em] sm:grid ${
          showOpenCases
            ? "grid-cols-[0.4fr_1.5fr_1fr_1fr_0.7fr]"
            : "grid-cols-[0.4fr_1.6fr_1fr_1fr]"
        }`}
      >
        <span>Rank</span>
        <span>Agency</span>
        <span>User Name</span>
        <span className="text-right">Response</span>
        {showOpenCases ? <span className="text-right">Open</span> : null}
      </div>

      {rows.map((row) => (
        <div
          key={row.rank}
          className={`score-row grid items-center gap-2 rounded-lg border px-3 py-3 ${
            showOpenCases
              ? "sm:grid-cols-[0.4fr_1.5fr_1fr_1fr_0.7fr]"
              : "sm:grid-cols-[0.4fr_1.6fr_1fr_1fr]"
          }`}
        >
          <span className="font-data text-2xl font-bold sm:text-xl">{row.rank}</span>
          <span className="font-body text-sm font-semibold sm:text-base">{row.agency}</span>
          <span className="font-body text-sm">{row.user}</span>
          <span className="font-data text-sm sm:text-right">{row.responseTime}</span>
          {showOpenCases ? <span className="font-data text-sm sm:text-right">{row.openCases}</span> : null}
        </div>
      ))}
    </div>
  );
}
