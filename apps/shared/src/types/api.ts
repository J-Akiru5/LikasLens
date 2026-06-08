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
  active_incidents_trend: string;
  resolved_today: number;
  resolved_today_total: number;
  resolved_today_progress: number;
  resolved_today_trend: string;
  avg_response_minutes: number;
  avg_response_sla: number;
  avg_response_progress: number;
  avg_response_trend: string;
  system_load: number;
  system_load_total: number;
  system_load_progress: number;
  system_load_trend: string;
  total_tickets: number;
  total_reports: number;
  total_users: number;
  ghost_reports: number;
  tickets_by_status: Record<string, number>;
}

export interface ActivityFeedItem {
  id: string;
  display_id: string;
  type: "Critical" | "Warning" | "Info";
  title: string;
  description: string;
  location: string;
  time: string;
  status: string;
  reporter: string;
}
