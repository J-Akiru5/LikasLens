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
  status: TicketStatus;
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
  is_redd_eligible?: boolean;
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

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
  closed: "Closed",
  pending_review: "Pending AI Review",
  verified: "Verified",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "bg-amber/10 text-amber",
  investigating: "bg-accent/10 text-accent",
  monitoring: "bg-purple/10 text-purple",
  resolved: "bg-green/10 text-green",
  closed: "bg-ink/10 text-ink/60",
  pending_review: "bg-amber/10 text-amber",
  verified: "bg-green/10 text-green",
};

// Triage
export interface TriageTicket {
  id: string;
  display_id: string;
  title: string;
  description: string;
  status: string;
  ai_confidence: number | null;
  ai_triage_summary: string | null;
  urgency_score: number | null;
  location: string;
  latitude?: number;
  longitude?: number;
  photo_url: string | null;
  photo_mime: string | null;
  classifications: {
    id: string;
    violation_type: string;
    confidence: number | null;
  }[];
  reporter: string;
  created_at: string;
  time_since: string;
}
