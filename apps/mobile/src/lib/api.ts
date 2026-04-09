import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Physical device: use your machine's local IP
// Android emulator: use 10.0.2.2
// iOS simulator / Web: use localhost
const API_URL = __DEV__
  ? Platform.OS === 'web' ? 'http://localhost:3001' : 'http://10.0.0.210:3001'
  : 'https://your-api.com';

// Web fallback for SecureStore (uses localStorage)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ success: boolean; data?: T; error?: any; meta?: any; message?: string }> {
  const { token, headers, ...rest } = options;

  try {
    const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
      },
      ...rest,
    });
    return res.json();
  } catch (error) {
    return { success: false, error: { message: 'Bağlantı hatası. Sunucuya erişilemiyor.' } };
  }
}

export async function getToken(): Promise<string | null> {
  return storage.getItem('accessToken');
}

export async function setToken(token: string): Promise<void> {
  await storage.setItem('accessToken', token);
}

export async function setUser(user: any): Promise<void> {
  await storage.setItem('user', JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  const user = await storage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export async function clearAuth(): Promise<void> {
  await storage.deleteItem('accessToken');
  await storage.deleteItem('refreshToken');
  await storage.deleteItem('user');
}

// Auth
export async function login(email: string, password: string) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Visits
export async function startVisit(data: {
  prospectId: string;
  routePlanItemId?: string;
  latitude: number;
  longitude: number;
}) {
  const token = await getToken();
  return api('/visits/start', {
    method: 'POST',
    token: token!,
    body: JSON.stringify(data),
  });
}

export async function endVisit(
  visitId: string,
  data: { result: string; resultNotes?: string; latitude: number; longitude: number },
) {
  const token = await getToken();
  return api(`/visits/${visitId}/end`, {
    method: 'PATCH',
    token: token!,
    body: JSON.stringify(data),
  });
}

export async function cancelVisit(visitId: string, data: { cancelReason: string }) {
  const token = await getToken();
  return api(`/visits/${visitId}/cancel`, {
    method: 'PATCH',
    token: token!,
    body: JSON.stringify(data),
  });
}

export async function getActiveVisit() {
  const token = await getToken();
  return api('/visits/active', { token: token! });
}

export async function getMyVisitHistory(params: {
  page?: number;
  limit?: number;
  result?: string;
  status?: string;
} = {}) {
  const token = await getToken();
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.result) q.set('result', params.result);
  if (params.status) q.set('status', params.status);
  const query = q.toString();
  return api(`/visits/me/history${query ? `?${query}` : ''}`, { token: token! });
}

// Planning
export async function getMyPlans(params: { year?: number; weekNumber?: number } = {}) {
  const token = await getToken();
  const user = await getUser();
  const q = new URLSearchParams();
  if (user?.id) q.set('userId', user.id);
  if (params.year) q.set('year', String(params.year));
  if (params.weekNumber) q.set('weekNumber', String(params.weekNumber));
  return api(`/planning?${q.toString()}`, { token: token! });
}

export async function getCurrentWeek() {
  const token = await getToken();
  return api('/planning/current-week', { token: token! });
}

export async function getMyCurrentPlan() {
  const token = await getToken();
  return api('/planning/me/current', { token: token! });
}

export async function getProspect(id: string) {
  const token = await getToken();
  return api(`/prospects/${id}`, { token: token! });
}
