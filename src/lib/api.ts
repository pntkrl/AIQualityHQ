const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aiq_session_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface User {
  id: string; email: string; name: string;
}

export interface Session {
  token: string; expiresAt: string;
}

export interface ApiKeyData {
  id: string; key_identifier: string; name: string;
  active: number; last_used_at: string | null; created_at: string;
}

export async function signup(email: string, password: string, name?: string): Promise<{ user: User; session: Session }> {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string): Promise<{ user: User; session: Session }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return request('/auth/me');
}

export async function getApiKeys(): Promise<{ keys: ApiKeyData[] }> {
  return request('/keys');
}

export async function createApiKey(name: string): Promise<{ key: { raw: string; identifier: string; name: string } }> {
  return request('/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(id: string): Promise<{ success: boolean }> {
  return request(`/keys/${id}`, { method: 'DELETE' });
}
