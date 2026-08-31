export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DashboardStats {
  active_incidents: number;
  active_incidents_total: number;
  active_incidents_progress: number;
  resolved_today: number;
  resolved_today_total: number;
  resolved_today_progress: number;
  total_tickets: number;
  total_reports: number;
  tickets_by_status: Record<string, number>;
  // Deprecated fields — no longer populated by admin handler.
  // Kept optional so consuming apps compile without breakage.
  active_incidents_trend?: string;
  resolved_today_trend?: string;
  avg_response_minutes?: number;
  avg_response_sla?: number;
  avg_response_progress?: number;
  avg_response_trend?: string;
  system_load?: number;
  system_load_total?: number;
  system_load_progress?: number;
  system_load_trend?: string;
  total_users?: number;
  ghost_reports?: number;
}

export interface ActivityFeedItem {
  id: string;
  display_id: string;
  type: "Critical" | "Warning" | "Info";
  title: string;
  description: string;
  location: string;
  created_at?: string;
  /** @deprecated Use created_at and compute relative time client-side */
  time?: string;
  status: string;
  reporter: string;
}

export interface LguPerformanceRow {
  lgu_id: string;
  lgu_name: string;
  region: string | null;
  is_active: boolean;
  total_assigned: number;
  total_resolved: number;
  resolution_rate: number;
  avg_response_hours: number;
  avg_resolution_hours: number;
  sla_compliance_rate: number;
  pending_count: number;
  breached_count: number;
  escalation_count: number;
  status: "green" | "amber" | "red";
}

export interface LguPlatformAverages {
  total_lgus: number;
  avg_resolution_rate: number;
  avg_response_hours: number;
  avg_resolution_hours: number;
  sla_compliance_rate: number;
  total_assigned: number;
  total_resolved: number;
  total_escalations: number;
}

export interface LguPerformanceData {
  lgus: LguPerformanceRow[];
  platform_averages: LguPlatformAverages;
  available_regions: string[];
}

export interface VerifiedReport {
  location: string;
  status: string;
  date: string;
  title: string;
}


export interface PublicImpactData {
  total_reports: number;
  total_resolved: number;
  total_citizens: number;
  total_ngos: number;
  resolution_rate: number;
  recent_verified: VerifiedReport[];
  reports_by_type: Record<string, number>;
}

export interface BiasRiskEntry {
  id: number;
  risk: string;
  category: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
  status: "open" | "partial" | "mitigated" | "closed";
  evidence_url: string | null;
  created_at: string;
  updated_at: string;
}
