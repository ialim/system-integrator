import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function action(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  if (!email || !password) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }
  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  redirect("/projects");
}

export default function LoginPage() {
  return (
    <main style={mainStyle}>
      <form action={action} style={cardStyle}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Login</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>Access your org projects and catalog.</p>
        <label style={labelStyle}>
          <span>Email</span>
          <input name="email" type="email" style={inputStyle} required />
        </label>
        <label style={labelStyle}>
          <span>Password</span>
          <input name="password" type="password" style={inputStyle} required />
        </label>
        <button type="submit" style={buttonStyle}>
          Login
        </button>
        <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>
          No account? <a href="/auth/signup" style={{ color: "var(--accent)" }}>Sign up</a>
        </p>
      </form>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  minHeight: "80vh"
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "1.25rem",
  display: "grid",
  gap: "0.75rem"
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  color: "var(--muted)",
  fontSize: "0.95rem"
};

const inputStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "0.75rem",
  borderRadius: "8px"
};

const buttonStyle: React.CSSProperties = {
  background: "var(--primary)",
  color: "#fff",
  border: "none",
  padding: "0.75rem",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer"
};
