const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: any; meta?: any; message?: string }> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  return res.json();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getUser(): any | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// Auth
export async function login(email: string, password: string) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Users
export async function getUsers(page = 1, limit = 20) {
  return api(`/users?page=${page}&limit=${limit}`, { token: getToken()! });
}

export async function getFieldUsers() {
  return api("/users/field-users", { token: getToken()! });
}

// Prospects
export async function getProspects(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  return api(`/prospects?${q.toString()}`, { token: getToken()! });
}

export async function getProspect(id: string) {
  return api(`/prospects/${id}`, { token: getToken()! });
}

export async function createProspect(data: any) {
  return api("/prospects", {
    method: "POST",
    token: getToken()!,
    body: JSON.stringify(data),
  });
}

export async function toggleProspectStatus(id: string) {
  return api(`/prospects/${id}/toggle-status`, {
    method: "PATCH",
    token: getToken()!,
  });
}

// Planning
export async function getPlans(params: { userId?: string; year?: number; weekNumber?: number } = {}) {
  const q = new URLSearchParams();
  if (params.userId) q.set("userId", params.userId);
  if (params.year) q.set("year", String(params.year));
  if (params.weekNumber) q.set("weekNumber", String(params.weekNumber));
  return api(`/planning?${q.toString()}`, { token: getToken()! });
}

export async function getPlan(id: string) {
  return api(`/planning/${id}`, { token: getToken()! });
}

export async function createPlan(data: { userId: string; year: number; weekNumber: number; items: { prospectId: string; dayOfWeek: number; visitOrder: number }[] }) {
  return api("/planning", {
    method: "POST",
    token: getToken()!,
    body: JSON.stringify(data),
  });
}

export async function updatePlan(id: string, data: { status?: string; items?: { prospectId: string; dayOfWeek: number; visitOrder: number }[] }) {
  return api(`/planning/${id}`, {
    method: "PATCH",
    token: getToken()!,
    body: JSON.stringify(data),
  });
}

export async function deletePlan(id: string) {
  return api(`/planning/${id}`, {
    method: "DELETE",
    token: getToken()!,
  });
}

export async function getCurrentWeek() {
  return api("/planning/current-week", { token: getToken()! });
}

export async function getUnassignedProspects() {
  return api("/prospects/unassigned", { token: getToken()! });
}
