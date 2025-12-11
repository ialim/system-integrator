import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Smart Integrator Platform",
  description: "Project designer and wholesale portal for smart products"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
            <Header />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header
      style={{
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "0.75rem 1rem",
        background: "var(--panel)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem"
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontWeight: 700 }}>
        <span style={{ color: "var(--accent)", letterSpacing: "0.08em" }}>INTEGRATOR</span>
        <a href="/" style={{ color: "var(--text)" }}>
          Catalog
        </a>
        <a href="/projects" style={{ color: "var(--text)" }}>
          Projects
        </a>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <a href="/auth/login" style={{ color: "var(--muted)", fontWeight: 600 }}>
          Login
        </a>
        <a
          href="/auth/signup"
          style={{
            background: "var(--primary)",
            color: "#fff",
            padding: "0.4rem 0.8rem",
            borderRadius: "8px",
            fontWeight: 700
          }}
        >
          Sign up
        </a>
      </div>
    </header>
  );
}
