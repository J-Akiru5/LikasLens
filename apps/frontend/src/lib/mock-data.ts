export type ScoreboardRow = {
  rank: number;
  agency: string;
  user: string;
  responseTime: string;
  openCases: number;
};

export type DashboardAlert = {
  id: string;
  category: "illegal_dumping" | "smoke_burn" | "river_pollution";
  district: string;
  priority: "low" | "medium" | "high";
  reportedAt: string;
  status: "queued" | "routed" | "in_progress";
};

export const scoreboardRows: ScoreboardRow[] = [
  {
    rank: 1,
    agency: "Forest Guard",
    user: "Gov Agency North",
    responseTime: "14 minutes",
    openCases: 11,
  },
  {
    rank: 2,
    agency: "Dept. Environment",
    user: "Gov Agency River",
    responseTime: "16 minutes",
    openCases: 16,
  },
  {
    rank: 3,
    agency: "City Sanitation",
    user: "Gov Agency Metro",
    responseTime: "20 minutes",
    openCases: 9,
  },
  {
    rank: 4,
    agency: "Coastal Watch",
    user: "Gov Agency Bay",
    responseTime: "23 minutes",
    openCases: 7,
  },
];

export const dashboardAlerts: DashboardAlert[] = [
  {
    id: "LL-4201",
    category: "illegal_dumping",
    district: "Riverside Drive",
    priority: "high",
    reportedAt: "2m ago",
    status: "routed",
  },
  {
    id: "LL-4200",
    category: "smoke_burn",
    district: "Pine District",
    priority: "medium",
    reportedAt: "12m ago",
    status: "in_progress",
  },
  {
    id: "LL-4198",
    category: "river_pollution",
    district: "South Creek",
    priority: "high",
    reportedAt: "18m ago",
    status: "queued",
  },
];
