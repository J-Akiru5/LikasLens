import { laravelGet, laravelPost, laravelPut, laravelDelete } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserProfile,
  Ticket,
  TicketDetail,
  DashboardStats,
  ActivityFeedItem,
  NgoGroup,
} from "../types";

// Auth
export function getProfile() {
  return laravelGet<ApiResponse<UserProfile>>("/user/profile");
}

// Citizen Dashboard
export function getUserImpact() {
  return laravelGet<ApiResponse<{
    eco_credits: number;
    trust_score: number;
    community_rank: number;
    total_reports: number;
    total_citizens: number;
    reports: { id: string; status: string; created_at: string }[];
  }>>("/user/impact");
}

// Dashboard
export function getDashboardStats() {
  return laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats");
}

export function getDashboardFeed() {
  return laravelGet<ApiResponse<ActivityFeedItem[]>>("/dashboard/feed");
}

// Tickets
export function getTickets(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<Ticket>>(`/tickets${qs}`);
}

export function getTicket(id: string) {
  return laravelGet<ApiResponse<TicketDetail>>(`/tickets/${id}`);
}

// Admin: Users
export function getAdminUsers(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<User>>(`/admin/users${qs}`);
}

export function getAdminUser(id: string) {
  return laravelGet<ApiResponse<User>>(`/admin/users/${id}`);
}

export function updateAdminUser(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<User>>(`/admin/users/${id}`, data);
}

export function updateUserRole(id: string, role: string) {
  return laravelPut<ApiResponse<User>>(`/admin/users/${id}/role`, { role });
}

export function deleteAdminUser(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/users/${id}`);
}

// Admin: NGOs
export function getAdminNgos(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<NgoGroup>>(`/admin/ngos${qs}`);
}

export function getAdminNgo(id: string) {
  return laravelGet<ApiResponse<NgoGroup>>(`/admin/ngos/${id}`);
}

export function createAdminNgo(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<NgoGroup>>("/admin/ngos", data);
}

export function updateAdminNgo(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<NgoGroup>>(`/admin/ngos/${id}`, data);
}

export function deleteAdminNgo(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/ngos/${id}`);
}
