const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type Project = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
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
