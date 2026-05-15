import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { BarChart3, TrendingUp, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Analytics & Reports</h1>
              <button className="brutal-button px-4 py-2 rounded text-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="brutal-panel p-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-bold uppercase">Incident Types</h2>
                  <BarChart3 className="w-5 h-5 text-primary/50" />
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Illegal Dumping", percent: 45, color: "bg-secondary" },
                    { label: "Deforestation", percent: 30, color: "bg-accent" },
                    { label: "Water Pollution", percent: 15, color: "bg-primary" },
                    { label: "Wildlife Endangerment", percent: 10, color: "bg-blue-400" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-mono text-sm font-bold uppercase mb-1">
                        <span>{stat.label}</span>
                        <span>{stat.percent}%</span>
                      </div>
                      <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                        <div className={`h-full ${stat.color}`} style={{ width: `${stat.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="brutal-panel p-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-bold uppercase">Resolution Efficiency</h2>
                  <TrendingUp className="w-5 h-5 text-primary/50" />
                </div>

                <div className="flex items-end h-48 gap-2 mt-4">
                  {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white font-mono text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                        {h} Cases
                      </div>
                      <div
                        className="w-full bg-secondary border-2 border-primary rounded-t group-hover:bg-accent transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-mono text-xs font-bold text-primary/60 uppercase mt-4 border-t-2 border-primary/10 pt-2">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            <div className="brutal-panel p-6 bg-white mt-8 border-4 border-accent shadow-[4px_4px_0px_#ffb703]">
              <h2 className="font-heading text-xl font-bold uppercase text-primary mb-2">AI Efficiency Insight</h2>
              <p className="font-mono text-sm leading-relaxed text-primary/80">
                The Neuro-Symbolic AI accurately categorized <strong>98.4%</strong> of reports this week, reducing manual dispatch time by an average of 4.2 hours per critical incident. Ghost Mode usage increased by 12% in high-risk zones, indicating strong community trust in the anonymity protocol.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
