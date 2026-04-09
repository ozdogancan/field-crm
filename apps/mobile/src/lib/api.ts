import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_TIMEOUT_MS = 12000;

function getDefaultApiUrl() {
  if (!__DEV__) {
    return 'https://your-api.com';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

const API_URL = configuredApiUrl || getDefaultApiUrl();
let unauthorizedHandler: (() => void | Promise<void>) | null = null;
let apiIssueHandler:
  | ((issue: { type: 'network' | 'timeout' | 'session'; message: string }) => void | Promise<void>)
  | null = null;

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
  skipAuthHandling?: boolean;
}

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export function setApiIssueHandler(
  handler:
    | ((issue: { type: 'network' | 'timeout' | 'session'; message: string }) => void | Promise<void>)
    | null,
) {
  apiIssueHandler = handler;
}

export function getApiBaseUrl() {
  return API_URL;
}

export async function api<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ success: boolean; data?: T; error?: any; meta?: any; message?: string }> {
  const { token, headers, skipAuthHandling, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
      },
      signal: controller.signal,
      ...rest,
    });
    clearTimeout(timeout);

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (res.status === 401 && token && !skipAuthHandling) {
      await clearAuth();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
      if (apiIssueHandler) {
        await apiIssueHandler({
          type: 'session',
          message: 'Oturum süresi doldu. Devam etmek için yeniden giriş yapın.',
        });
      }
      return {
        success: false,
        error: { message: 'Oturum süresi doldu. Lütfen yeniden giriş yapın.' },
        message: 'Unauthorized',
      };
    }

    if (!res.ok && !payload) {
      return {
        success: false,
        error: { message: 'Sunucudan geçerli yanıt alınamadı.' },
        message: 'HTTP_ERROR',
      };
    }

    return payload;
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      if (apiIssueHandler) {
        await apiIssueHandler({
          type: 'timeout',
          message: 'İstek zaman aşımına uğradı. Ağ bağlantısını kontrol edip tekrar deneyin.',
        });
      }
      return {
        success: false,
        error: { message: 'İstek zaman aşımına uğradı. Ağ bağlantısını kontrol edip tekrar deneyin.' },
        message: 'TIMEOUT',
      };
    }

    if (apiIssueHandler) {
      await apiIssueHandler({
        type: 'network',
        message: 'Bağlantı hatası. Sunucuya erişilemiyor.',
      });
    }
    return {
      success: false,
      error: { message: 'Bağlantı hatası. Sunucuya erişilemiyor.' },
      message: 'NETWORK_ERROR',
    };
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
