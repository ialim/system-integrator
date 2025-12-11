import { fetchProducts } from "../lib/products";

export default async function Home() {
  let data:
    | { items: Awaited<ReturnType<typeof fetchProducts>>["items"]; total: number }
    | null = null;
  let error: string | null = null;

  try {
    const res = await fetchProducts({ limit: 8 });
    data = { items: res.items, total: res.total };
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load products";
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", background: "#0b1021", color: "#f5f7fb" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <header style={{ background: "#111831", border: "1px solid #1f2940", borderRadius: "16px", padding: "1.5rem" }}>
          <p style={{ letterSpacing: "0.08em", fontSize: "0.85rem", color: "#7bb5ff", margin: 0 }}>
            SYSTEM INTEGRATOR WHOLESALE
          </p>
          <h1 style={{ margin: "0.35rem 0 0.25rem", fontSize: "2.1rem" }}>Wholesale + Project Designer</h1>
          <p style={{ color: "#c7d2e6", margin: "0 0 0.75rem" }}>
            Catalog feed from suppliers with pricing, availability, and quick BOM building.
          </p>
        </header>

        <section style={{ background: "#111831", border: "1px solid #1f2940", borderRadius: "16px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>Catalog preview</div>
              <div style={{ color: "#9fb3d8" }}>Showing sample products from suppliers</div>
            </div>
            <div style={{ color: "#7bb5ff", fontWeight: 600 }}>{data ? `${data.total} items` : ""}</div>
          </div>
          {error && <div style={{ color: "#f59e0b" }}>{error}</div>}
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {data?.items?.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
            {!data && !error && <div style={{ color: "#9fb3d8" }}>Loading products…</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductCard({ product }: { product: any }) {
  const brand = product?.facets?.find((f: any) => f.key === "brand")?.value;
  return (
    <div style={{ padding: "1rem", borderRadius: "12px", background: "#161f38", border: "1px solid #1f2940" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ fontWeight: 700 }}>{product.name}</div>
        <div style={{ color: "#7bb5ff", fontSize: "0.9rem" }}>{product.sku}</div>
      </div>
      {brand && <div style={{ color: "#9fb3d8", fontSize: "0.9rem" }}>{brand}</div>}
      {product.category && (
        <div style={{ color: "#c7d2e6", fontSize: "0.9rem", marginTop: "0.25rem" }}>{product.category}</div>
      )}
      <div style={{ color: "#d5def0", fontSize: "0.95rem", marginTop: "0.5rem" }}>
        {product.description?.slice(0, 140) || "No description"}
        {product.description && product.description.length > 140 ? "…" : ""}
      </div>
      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#7bb5ff", fontWeight: 700 }}>
          {product.currency || ""} {product.msrp || product.unit_cost || ""}
        </div>
        {product.stock_band && (
          <span style={{ fontSize: "0.85rem", color: "#9fb3d8" }}>{product.stock_band}</span>
        )}
      </div>
    </div>
  );
}
