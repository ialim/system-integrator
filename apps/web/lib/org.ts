const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type OrgUser = {
  id: number;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
  emailVerifiedAt?: string | null;
};

export type Invite = {
  id: number;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
};

export type OrgProfile = {
  id: number;
  name: string;
  businessAddress?: Record<string, any> | null;
  proposalDefaults?: Record<string, any> | null;
};

export async function fetchOrgUsers(token: string): Promise<OrgUser[]> {
  const res = await fetch(`${API_URL}/org/users`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
  return res.json();
}

export async function fetchOrgInvites(token: string): Promise<Invite[]> {
  const res = await fetch(`${API_URL}/org/invites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch invites (${res.status})`);
  return res.json();
}

export async function createInvite(token: string, body: { email: string; role?: string }) {
  const res = await fetch(`${API_URL}/org/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to create invite (${res.status})`);
  return res.json();
}

export async function updateUserRole(token: string, userId: number, role: string) {
  const res = await fetch(`${API_URL}/org/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error(`Failed to update role (${res.status})`);
  return res.json();
}

export async function revokeInvite(token: string, inviteId: number) {
  const res = await fetch(`${API_URL}/org/invites/${inviteId}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to revoke invite (${res.status})`);
  return res.json();
}

export async function fetchOrgProfile(token: string): Promise<OrgProfile> {
  const res = await fetch(`${API_URL}/org/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch org profile (${res.status})`);
  return res.json();
}

export async function updateOrgProfile(
  token: string,
  body: { name?: string; businessAddress?: Record<string, any> | null; proposalDefaults?: Record<string, any> | null }
) {
  const res = await fetch(`${API_URL}/org/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to update org profile (${res.status})`);
  return res.json();
}
