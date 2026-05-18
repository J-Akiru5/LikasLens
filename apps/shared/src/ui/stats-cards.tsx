import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Activity,
} from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  total: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  progress: number;
  progressColor: string;
  description: string;
}

export function StatsCards({ stats }: { stats?: StatItem[] }) {
  const defaultStats: StatItem[] = stats || [
    {
      label: "Active Incidents",
      value: "5",
      total: "/ 200",
      trend: "+12%",
      isPositive: false,
      icon: AlertOctagon,
      color: "text-accent",
      borderColor: "border-accent",
      progress: 15,
      progressColor: "bg-accent",
      description: "Current active cases",
    },
    {
      label: "Resolved Today",
      value: "2",
      total: "/ 50",
      trend: "+5%",
      isPositive: true,
      icon: CheckCircle2,
      color: "text-secondary",
      borderColor: "border-secondary",
      progress: 4,
      progressColor: "bg-secondary",
      description: "Daily resolution quota",
    },
    {
      label: "Avg Response",
      value: "18",
      total: "m",
      trend: "-2m",
      isPositive: true,
      icon: Clock,
      color: "text-primary",
      borderColor: "border-primary",
      progress: 60,
      progressColor: "bg-primary",
      description: "vs 30m SLA",
    },
    {
      label: "System Load",
      value: "15",
      total: "%",
      trend: "Stable",
      isPositive: true,
      icon: Activity,
      color: "text-secondary",
      borderColor: "border-secondary",
      progress: 15,
      progressColor: "bg-secondary",
      description: "Capacity utilization",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {defaultStats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`brutal-panel panel-surface p-6 relative overflow-hidden group border-2 ${stat.borderColor} shadow-[4px_4px_0px_rgba(27,67,50,0.2)]`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-background/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="font-mono text-sm font-bold uppercase tracking-widest surface-muted">
                {stat.label}
              </div>
              <div
                className={`p-2 border-2 ${stat.borderColor} rounded bg-background shadow-[2px_2px_0px_#1b4332] ${stat.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-end gap-3 relative z-10 mb-4">
              <div className="font-heading text-5xl font-black text-primary">
                {stat.value}
              </div>
              <div className="flex flex-col">
                <div className="font-mono text-xs text-foreground/60 mb-1">
                  {stat.total}
                </div>
                <div
                  className="flex items-center font-mono text-sm font-bold tracking-widest"
                  style={{ color: stat.isPositive ? "var(--secondary-fg)" : "var(--accent-fg)" }}
                >
                  {stat.isPositive ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-xs font-mono text-foreground/50 mb-2">
                {stat.description}
              </div>
              <div
                className="w-full h-5 bg-foreground/10 rounded overflow-hidden relative z-10 border-2 border-foreground/30"
                role="progressbar"
                aria-valuenow={Math.round(stat.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${stat.label}: ${Math.round(stat.progress)}%`}
              >
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    stat.progressColor === "bg-secondary"
                      ? "bg-[#2de1c2]"
                      : stat.progressColor === "bg-accent"
                      ? "bg-[#ffb703]"
                      : "bg-[#1B4332]"
                  } shadow-[0_0_12px_var(--progress-glow),inset_0_0_4px_rgba(255,255,255,0.2)]`}
                  style={{
                    width: `${Math.min(stat.progress, 100)}%`,
                    "--progress-glow":
                      stat.progressColor === "bg-secondary"
                        ? "rgba(45,225,194,1)"
                        : "rgba(255,183,3,1)",
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-foreground/60 mt-2 font-bold uppercase tracking-widest">
                <span>{Math.round(stat.progress)}%</span>
                <span>
                  {stat.progress >= 100 ? "✓ Complete" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
