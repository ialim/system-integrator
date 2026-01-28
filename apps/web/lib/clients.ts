const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type Client = {
  id: number;
  orgId: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: Record<string, any> | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchClients(token: string, params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/clients${search.toString() ? `?${search.toString()}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  return (await res.json()) as { items: Client[]; total: number; limit: number; offset: number };
}

export async function fetchClient(token: string, clientId: number) {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch client (${res.status})`);
  return res.json() as Promise<Client>;
}

export async function createClient(token: string, body: Partial<Client>) {
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to create client (${res.status})`);
  return res.json();
}

export async function updateClient(token: string, clientId: number, body: Partial<Client>) {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to update client (${res.status})`);
  return res.json();
}

export async function deleteClient(token: string, clientId: number) {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to delete client (${res.status})`);
  return res.json();
}
