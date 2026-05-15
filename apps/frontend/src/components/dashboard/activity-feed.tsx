import { AlertTriangle, Info, Map } from "lucide-react";

const feed = [
  {
    id: "INC-092",
    type: "Critical",
    title: "Illegal Dumping Detected",
    location: "Sector 4, Riverside",
    time: "10 mins ago",
    status: "Routing to Agency"
  },
  {
    id: "INC-091",
    type: "Warning",
    title: "Air Quality Drop",
    location: "Downtown Core",
    time: "45 mins ago",
    status: "Monitoring"
  },
  {
    id: "INC-090",
    type: "Info",
    title: "Resolution Confirmed",
    location: "Park District",
    time: "2 hours ago",
    status: "Archived"
  },
];

export function ActivityFeed() {
  return (
    <div className="brutal-panel bg-white p-0 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b-4 border-primary bg-background flex justify-between items-center">
        <h2 className="font-heading text-2xl font-black uppercase">Live Intelligence Feed</h2>
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent border border-primary"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {feed.map((item, idx) => (
          <div key={idx} className="p-6 border-b-2 border-primary/10 hover:bg-background transition-colors flex gap-6 group">
            <div className="hidden sm:flex flex-col items-center">
              <div className={`w-12 h-12 rounded border-2 border-primary flex items-center justify-center shadow-[2px_2px_0px_#1b4332] group-hover:scale-110 transition-transform ${item.type === 'Critical' ? 'bg-accent text-primary' : item.type === 'Warning' ? 'bg-secondary text-primary' : 'bg-background text-primary'}`}>
                {item.type === 'Critical' ? <AlertTriangle className="w-6 h-6" /> : item.type === 'Warning' ? <Map className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <div className="w-0.5 h-full bg-primary/20 mt-4 group-last:hidden"></div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-xs font-bold text-primary/60 border border-primary/20 px-2 py-1 rounded inline-block bg-white">
                  {item.id}
                </div>
                <div className="font-mono text-xs font-bold">{item.time}</div>
              </div>

              <h3 className="font-heading text-xl font-bold uppercase mb-1">{item.title}</h3>
              <p className="font-mono text-sm opacity-80 mb-4">{item.location}</p>

              <div className="flex items-center gap-2">
                <div className="text-xs font-mono font-bold uppercase tracking-widest border-2 border-primary px-3 py-1 rounded bg-white shadow-[2px_2px_0px_#1b4332]">
                  Status: {item.status}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="p-6 text-center">
          <button className="brutal-button px-6 py-2 text-sm">Load Older Logs</button>
        </div>
      </div>
    </div>
  );
}
