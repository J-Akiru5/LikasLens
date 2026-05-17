export type TicketStatus =
  | "open"
  | "investigating"
  | "monitoring"
  | "resolved"
  | "closed"
  | "pending_review"
  | "verified";

export interface Ticket {
  id: string;
  display_id: string;
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: string;
  urgency_score?: number;
  category?: string;
  reporter?: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface TicketDetail extends Ticket {
  address_text?: string;
  ai_triage_summary?: string;
  ai_confidence?: number;
  evidence: TicketEvidence[];
  classifications: TicketClassification[];
  assignments: TicketAssignment[];
}

export interface TicketEvidence {
  id: string;
  file_path: string;
  file_type: string;
  uploaded_by?: { id: string; name: string };
}

export interface TicketClassification {
  id: string;
  violation_type: string;
  confidence: number;
}

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  assigned_group_id: string;
  assigned_by_user_id: string;
  status: string;
  assignment_reason?: string;
  completed_at?: string;
  ngo_group?: NgoGroup;
  assigned_by?: { id: string; name: string };
}

export interface NgoGroup {
  id: string;
  name: string;
  region: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
}

export type ReportStatus = "pending_review" | "verified" | "resolved";

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
  closed: "Closed",
  pending_review: "Pending AI Review",
  verified: "Verified",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  investigating: "bg-blue-100 text-blue-800",
  monitoring: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  pending_review: "bg-orange-100 text-orange-800",
  verified: "bg-emerald-100 text-emerald-800",
};
