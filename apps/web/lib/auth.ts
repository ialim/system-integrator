const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchProfile(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
  return res.json();
}

export async function refreshSession(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) throw new Error(`Failed to refresh session (${res.status})`);
  return res.json();
}

export async function logout() {
  'use server';
  const { cookies } = await import('next/headers');
  const refreshToken = cookies().get('refresh_token')?.value;
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // ignore logout errors
    }
  }
  cookies().delete('token');
  cookies().delete('refresh_token');
  cookies().delete('mfa_token');
  cookies().delete('mfa_setup_secret');
  cookies().delete('mfa_setup_uri');
}
