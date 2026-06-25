export interface BarangayCentroid {
  id: string;
  name: string;
  city_municipality: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  psgc_code: string | null;
}

export interface CountryCodeEntry {
  id: string;
  alpha2_code: string;
  numeric_code: string;
  country_name: string;
  currency_code: string | null;
  currency_name: string | null;
  eco_credit_rate: number;
  is_active: boolean;
}

export interface SlaConfig {
  id: string;
  violation_type: string;
  response_hours: number;
  resolution_hours: number;
  escalation_enabled: boolean;
  country_code: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  country_code?: string | null;
  score: number;
  report_count: number;
  trust_score: number;
  avatar_url?: string | null;
}

export interface LeaderboardSpotlight {
  user_id: string;
  name: string;
  report_count: number;
  trust_score: number;
  highlight: string;
}

export interface LeaderboardStats {
  total_participants: number;
  total_reports_submitted: number;
  total_reports_verified: number;
  avg_trust_score: number;
}

export interface HeatmapData {
  points: HeatmapPoint[];
  clusters: HeatmapCluster[];
  hot_zones: HotZone[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  type: string;
  urgency_score: number | null;
}

export interface HeatmapCluster {
  center_lat: number;
  center_lng: number;
  count: number;
  location: string;
  dominant_type: string;
}

export interface HotZone {
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  report_count: number;
  dominant_type: string;
  urgency: string;
  location: string;
}

export interface WalletData {
  available_credits: number;
  lifetime_earned: number;
  ledger_entries: LedgerEntry[];
  recent_redemptions: RedemptionEntry[];
}

export interface LedgerEntry {
  id: string;
  reference_type: string;
  reference_id: string | null;
  direction: string;
  points: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
}

export interface RedemptionEntry {
  id: string;
  reward_name: string;
  points_spent: number;
  redemption_status: string;
  redemption_code: string;
  fulfilled_at: string | null;
  created_at: string;
}

export interface RewardItem {
  id: string;
  reward_name: string;
  reward_type: string;
  points_cost: number;
  stock_quantity: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  partner_store: {
    id: string;
    name: string;
  } | null;
}

export interface AnalyticsDashboardData {
  total_reports: number;
  total_tickets: number;
  total_resolved: number;
  resolution_rate: number;
  avg_response_time: string;
  reports_by_day: { date: string; count: number }[];
  tickets_by_status: Record<string, number>;
  tickets_by_type: Record<string, number>;
}

export interface ViolationTypeEntry {
  code: string;
  name: string;
}
