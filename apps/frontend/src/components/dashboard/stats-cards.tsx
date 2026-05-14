import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertOctagon, Activity } from "lucide-react";

const stats = [
  {
    label: "Active Incidents",
    value: "142",
    trend: "+12%",
    isPositive: false,
    icon: AlertOctagon,
    color: "text-accent"
  },
  {
    label: "Resolved Today",
    value: "28",
    trend: "+5%",
    isPositive: true,
    icon: CheckCircle2,
    color: "text-secondary"
  },
  {
    label: "Avg Response",
    value: "18m",
    trend: "-2m",
    isPositive: true,
    icon: Clock,
    color: "text-primary"
  },
  {
    label: "System Load",
    value: "98%",
    trend: "Stable",
    isPositive: true,
    icon: Activity,
    color: "text-blue-500"
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

            <div className="flex items-end gap-3 relative z-10">
              <div className="font-heading text-5xl font-black text-primary">{stat.value}</div>
              <div className={`flex items-center font-mono text-sm font-bold mb-1 ${stat.isPositive ? 'text-secondary' : 'text-accent'}`}>
                {stat.isPositive ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {stat.trend}
              </div>
            </div>

            <Icon className="absolute -bottom-6 -right-6 w-32 h-32 text-primary/5 group-hover:scale-110 transition-transform duration-500" />
          </div>
        );
      })}
    </div>
  );
}
