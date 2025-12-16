const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type Project = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

export type ProjectDetail = Project & {
  rooms: Array<{ id: number; name: string; notes?: string | null }>;
  lineItems: Array<{
    id: number;
    qty: number;
    notes?: string | null;
    unitPrice?: number | null;
    product: {
      id: number;
      sku: string;
      name: string;
      category?: string | null;
      msrp?: number | null;
      currency?: string | null;
    };
    room?: { id: number; name: string } | null;
  }>;
  bomVersions: Array<{
    id: number;
    createdAt: string;
    totals: { subtotal?: number } | Record<string, any> | null;
  }>;
};

export async function fetchProjects(token: string, params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));

  const res = await fetch(`${API_URL}/projects${search.toString() ? `?${search.toString()}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
  return (await res.json()) as { items: Project[]; total: number; limit: number; offset: number };
}

export async function createProject(token: string, body: { name: string; clientMeta?: Record<string, any> }) {
  const res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to create project (${res.status})`);
  return res.json();
}

export async function fetchProjectDetail(token: string, id: number): Promise<ProjectDetail> {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);
  return res.json();
}

export async function addLineItem(
  token: string,
  projectId: number,
  body: { productId: number; qty: number; roomId?: number; notes?: string }
) {
  const res = await fetch(`${API_URL}/projects/${projectId}/line-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to add line item (${res.status})`);
  return res.json();
}

export async function updateLineItem(
  token: string,
  projectId: number,
  lineItemId: number,
  body: { qty?: number; roomId?: number; notes?: string }
) {
  const res = await fetch(`${API_URL}/projects/${projectId}/line-items/${lineItemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to update line item (${res.status})`);
  return res.json();
}

export async function deleteLineItem(token: string, projectId: number, lineItemId: number) {
  const res = await fetch(`${API_URL}/projects/${projectId}/line-items/${lineItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to delete line item (${res.status})`);
  return res.json();
}

export async function createBomSnapshot(token: string, projectId: number) {
  const res = await fetch(`${API_URL}/projects/${projectId}/bom-versions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to create BOM snapshot (${res.status})`);
  return res.json();
}

export async function createRoom(token: string, projectId: number, name: string) {
  const res = await fetch(`${API_URL}/projects/${projectId}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error(`Failed to create room (${res.status})`);
  return res.json();
}

export async function renameRoom(token: string, projectId: number, roomId: number, name: string) {
  const res = await fetch(`${API_URL}/projects/${projectId}/rooms/${roomId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error(`Failed to rename room (${res.status})`);
  return res.json();
}
