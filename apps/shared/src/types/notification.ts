export interface AppNotification {
  id: string;
  type: string;
  data: {
    ticket_id?: string;
    from_status?: string;
    to_status?: string;
    message?: string;
    response_breached?: boolean;
    resolution_breached?: boolean;
    escalated_at?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
