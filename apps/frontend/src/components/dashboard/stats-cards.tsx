import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertOctagon, Activity } from "lucide-react";

const stats = [
  {
    label: "Active Incidents",
    value: "142",
    trend: "+12%",
    isPositive: false,
    icon: AlertOctagon,
    color: "text-accent",
    progress: 75,
    progressColor: "bg-accent"
  },
  {
    label: "Resolved Today",
    value: "28",
    trend: "+5%",
    isPositive: true,
    icon: CheckCircle2,
    color: "text-secondary",
    progress: 40,
    progressColor: "bg-secondary"
  },
  {
    label: "Avg Response",
    value: "18m",
    trend: "-2m",
    isPositive: true,
    icon: Clock,
    color: "text-primary",
    progress: 85,
    progressColor: "bg-primary"
  },
  {
    label: "System Load",
    value: "98%",
    trend: "Stable",
    isPositive: true,
    icon: Activity,
    color: "text-blue-500",
    progress: 98,
    progressColor: "bg-blue-500"
  }
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="brutal-panel p-6 bg-white relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="font-mono text-sm font-bold uppercase text-primary/70">{stat.label}</div>
              <div className={`p-2 border-2 border-primary rounded bg-background shadow-[2px_2px_0px_#1b4332] ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-end gap-3 relative z-10 mb-4">
              <div className="font-heading text-5xl font-black text-primary">{stat.value}</div>
              <div className={`flex items-center font-mono text-sm font-bold mb-1 ${stat.isPositive ? 'text-secondary' : 'text-accent'}`}>
                {stat.isPositive ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {stat.trend}
              </div>
            </div>

            <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden relative z-10">
              <div className={`h-full ${stat.progressColor} transition-all duration-1000 ease-out`} style={{ width: `${stat.progress}%` }} />
            </div>

            <Icon className="absolute -bottom-6 -right-6 w-32 h-32 text-primary/5 group-hover:scale-110 transition-transform duration-500" />
          </div>
        );
      })}
    </div>
  );
}
