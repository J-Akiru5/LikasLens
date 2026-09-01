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
  ghost_mode?: boolean;
  reporter_user_id?: string | null;
  reporter_display_name?: string | null;
  ai_recommended_office?: string | null;
  evidence?: Array<{
    id: string;
    storage_bucket?: string | null;
    storage_path?: string | null;
    uploaded_by_user_id?: string | null;
  }>;
  created_at: string;
  resolved_at?: string | null;
}

export interface TicketDetail extends Ticket {
  address_text?: string;
  ai_triage_summary?: string;
  ai_confidence?: number;
  ai_recommended_office?: string | null;
  routing_source?: string | null;
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
  assignee_user_id?: string | null;
  status: string;
  assignment_reason?: string;
  completed_at?: string;
  ngo_group?: NgoGroup;
  assigned_by?: { id: string; name: string };
  assigned_to?: { id: string; name: string } | null;
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
  closed: "Withdrawn / Dismissed",
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

// True success terminals — the states citizens should celebrate.
export const SUCCESS_TERMINALS: ReadonlySet<TicketStatus> = new Set([
  "resolved",
  "verified",
]);

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

// ── AI Explainability ──────────────────────────────────────────────────

export interface ConfidenceBreakdown {
  visual: number;
}

export interface RuleChain {
  rule_fired: string;
  statute: string;
  agency: string;
}

export interface NeighbourTicket {
  id: string;
  title: string;
  status: string;
  ai_confidence: number;
  created_at: string;
}

export interface TicketExplainResponse {
  ticket_id: string;
  display_id: string;
  category: string;
  confidence: number;
  confidence_breakdown: ConfidenceBreakdown;
  rule_chain: RuleChain;
  neighbours: NeighbourTicket[];
}

export interface AdminLaw {
  id: string;
  law_code: string;
  title: string;
  summary: string;
  issuing_agency: string;
  jurisdiction_scope: string | null;
  source_url: string | null;
  is_active: boolean;
  country_code?: string;
}

export interface AdminLawPenalty {
  id: string;
  law_id: string;
  violation_name: string;
  penalty_type: string;
  min_fine_php: number | null;
  max_fine_php: number | null;
  min_imprisonment_yrs: number | null;
  max_imprisonment_yrs: number | null;
  notes: string | null;
}

export interface AdminViolationType {
  id: string;
  law_id: string;
  code: string;
  name: string;
  description: string;
  default_penalty_id: string | null;
}

export interface AdminLawDetail extends AdminLaw {
  penalties: AdminLawPenalty[];
  violationTypes: AdminViolationType[];
}

export interface PartnerStore {
  id: string;
  name: string;
}

export interface AdminReward {
  id: string;
  reward_name: string;
  reward_type: string;
  points_cost: number;
  stock_quantity: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  partner_store: PartnerStore | null;
}
