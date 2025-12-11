export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 720, background: "#111831", borderRadius: "16px", padding: "2rem", border: "1px solid #1f2940" }}>
        <p style={{ letterSpacing: "0.08em", fontSize: "0.85rem", color: "#7bb5ff", margin: 0 }}>SYSTEM INTEGRATOR WHOLESALE</p>
        <h1 style={{ margin: "0.35rem 0 0.5rem", fontSize: "2rem" }}>Wholesale + Project Designer</h1>
        <p style={{ color: "#c7d2e6", margin: "0 0 1.5rem" }}>
          Next.js frontend scaffold. Upcoming: catalog browser, BOM builder, pricing, and quote/PO flows.
        </p>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Card title="Catalog" body="Product search, filters, compatibility and availability." />
          <Card title="Projects" body="Rooms/zones, bundles, accessories, BOM versions." />
          <Card title="Pricing" body="Tiered discounts, VAT/shipping estimates, payment gateways." />
          <Card title="Ops" body="Quotes/POs, documents, notifications, audit logs." />
        </div>
      </div>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "12px", background: "#161f38", border: "1px solid #1f2940" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{title}</div>
      <div style={{ color: "#d5def0", fontSize: "0.95rem", lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
