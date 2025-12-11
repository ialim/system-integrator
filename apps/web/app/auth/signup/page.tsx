import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function action(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const orgName = formData.get("orgName")?.toString() || "";
  const name = formData.get("name")?.toString() || "";
  if (!email || !password || !orgName) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, orgName, name })
  });

  if (!res.ok) {
    throw new Error("Signup failed");
  }
  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  redirect("/projects");
}

export default function SignupPage() {
  return (
    <main style={mainStyle}>
      <form action={action} style={cardStyle}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Sign up</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>Create your org to start building projects.</p>
        <label style={labelStyle}>
          <span>Org name</span>
          <input name="orgName" type="text" style={inputStyle} required />
        </label>
        <label style={labelStyle}>
          <span>Email</span>
          <input name="email" type="email" style={inputStyle} required />
        </label>
        <label style={labelStyle}>
          <span>Name (optional)</span>
          <input name="name" type="text" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          <span>Password</span>
          <input name="password" type="password" style={inputStyle} required />
        </label>
        <button type="submit" style={buttonStyle}>
          Sign up
        </button>
        <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>
          Have an account? <a href="/auth/login" style={{ color: "var(--accent)" }}>Login</a>
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
  maxWidth: 480,
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
