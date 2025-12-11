import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createProject, fetchProjects } from "../../lib/projects";

async function getToken() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  return token;
}

export default async function ProjectsPage({ searchParams }: { searchParams?: { limit?: string; offset?: string } }) {
  const token = await getToken();
  if (!token) {
    redirect("/"); // simple guard; in real app, send to login
  }

  const limit = searchParams?.limit ? Number(searchParams.limit) : 10;
  const offset = searchParams?.offset ? Number(searchParams.offset) : 0;

  let data: { items: any[]; total: number; limit: number; offset: number } | null = null;
  let error: string | null = null;
  try {
    data = await fetchProjects(token!, { limit, offset });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load projects";
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Projects</h1>
        <p style={{ margin: "0 0 1rem", color: "#9fb3d8" }}>List projects and create new ones.</p>
        <ProjectForm token={token!} />
        {error && <div style={{ color: "#f59e0b" }}>{error}</div>}
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          {data?.items?.map((p) => (
            <div key={p.id} style={rowStyle}>
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: "#9fb3d8", fontSize: "0.9rem" }}>{p.status}</div>
              </div>
              <div style={{ color: "#7bb5ff" }}>#{p.id}</div>
            </div>
          ))}
          {!data && !error && <div style={{ color: "#9fb3d8" }}>Loading projects…</div>}
          {data && data.items.length === 0 && <div style={{ color: "#9fb3d8" }}>No projects yet.</div>}
        </div>
      </div>
    </main>
  );
}

function ProjectForm({ token }: { token: string }) {
  async function action(formData: FormData) {
    "use server";
    const name = formData.get("name")?.toString() || "";
    if (!name) return;
    await createProject(token, { name });
  }

  return (
    <form action={action} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input name="name" placeholder="Project name" style={inputStyle} />
      <button type="submit" style={buttonStyle}>
        Create
      </button>
    </form>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "2rem",
  background: "#0b1021",
  color: "#f5f7fb"
};

const cardStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  background: "#111831",
  borderRadius: "16px",
  border: "1px solid #1f2940",
  padding: "1.5rem",
  display: "grid",
  gap: "0.75rem"
};

const rowStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "10px",
  background: "#161f38",
  border: "1px solid #1f2940",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const inputStyle: React.CSSProperties = {
  background: "#0e1427",
  border: "1px solid #1f2940",
  color: "#f5f7fb",
  padding: "0.75rem",
  borderRadius: "8px",
  flex: 1
};

const buttonStyle: React.CSSProperties = {
  background: "#1f6feb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "0.75rem 1.25rem",
  cursor: "pointer"
};
