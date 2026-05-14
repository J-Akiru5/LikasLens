import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { AlertTriangle, Filter, MoreVertical, Search } from "lucide-react";

export default function IncidentsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Reported Incidents</h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                  <input
                    type="text"
                    placeholder="Search ID or Keyword..."
                    className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                  />
                </div>
                <button className="brutal-panel p-2 hover:bg-primary hover:text-white transition-colors cursor-pointer border-2 border-primary shadow-[2px_2px_0px_#1b4332]">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="brutal-panel panel-surface p-0 overflow-hidden">
              <div className="grid grid-cols-12 font-mono font-bold text-xs sm:text-sm uppercase p-4 border-b-2 border-[#081c15]" style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}>
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {[
                { id: "INC-104", cat: "Deforestation", loc: "Northern Ridge", stat: "Critical" },
                { id: "INC-103", cat: "Water Pollution", loc: "Lake View", stat: "Investigating" },
                { id: "INC-102", cat: "Illegal Dumping", loc: "Highway 9", stat: "Resolved" },
                { id: "INC-101", cat: "Wildfire Risk", loc: "Sector 7", stat: "Monitoring" },
                { id: "INC-100", cat: "Wildlife Threat", loc: "National Park", stat: "Resolved" },
              ].map((inc, i) => (
                <div key={i} className="grid grid-cols-12 items-center border-t-2 border-primary/20 p-4 hover:bg-secondary/10 transition-colors font-medium">
                  <div className="col-span-2 font-mono text-sm font-bold">{inc.id}</div>
                  <div className="col-span-3 flex items-center gap-2">
                    {inc.stat === 'Critical' && <AlertTriangle className="w-4 h-4 text-accent" />}
                    {inc.cat}
                  </div>
                  <div className="col-span-3 surface-muted">{inc.loc}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold border-2 uppercase font-mono tracking-widest ${
                      inc.stat === 'Critical' ? 'border-accent text-accent' :
                      inc.stat === 'Resolved' ? 'border-secondary text-primary' :
                      'border-primary text-primary'
                    }`}>
                      {inc.stat}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                      <MoreVertical className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button className="brutal-button px-6 py-3 rounded text-sm tracking-wider">
                Load More Records
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
