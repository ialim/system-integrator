import { fetchProduct } from "../../../lib/products";

type PageProps = {
  params: { sku: string };
};

export default async function ProductDetail({ params }: PageProps) {
  let product: Awaited<ReturnType<typeof fetchProduct>> | null = null;
  let error: string | null = null;
  try {
    product = await fetchProduct(params.sku);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load product";
  }

  if (!product && error) {
    return (
      <main style={mainStyle}>
        <div style={cardStyle}>
          <h1 style={{ margin: 0 }}>Product</h1>
          <p style={{ color: "#f59e0b" }}>{error}</p>
          <a href="/" style={{ color: "#7bb5ff" }}>
            Back to catalog
          </a>
        </div>
      </main>
    );
  }

  if (!product) return null;

  const brand = product?.facets?.find((f: any) => f.key === "brand")?.value;
  const attrs = product?.facets?.filter((f: any) => f.key !== "brand") || [];

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <a href="/" style={{ color: "#7bb5ff" }}>
          ← Back
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <div>
            <p style={{ letterSpacing: "0.05em", color: "#7bb5ff", margin: 0 }}>{product.sku}</p>
            <h1 style={{ margin: "0.25rem 0 0.2rem" }}>{product.name}</h1>
            {brand && <div style={{ color: "#9fb3d8" }}>{brand}</div>}
            {product.category && <div style={{ color: "#c7d2e6" }}>{product.category}</div>}
          </div>
          <div style={{ color: "#7bb5ff", fontWeight: 700, fontSize: "1.1rem" }}>
            {product.currency || ""} {product.msrp || product.unit_cost || ""}
          </div>
        </div>
        <p style={{ color: "#d5def0", lineHeight: 1.5 }}>{product.description || "No description"}</p>
        {attrs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {attrs.map((a: any) => (
              <span key={`${a.key}-${a.value}`} style={chipStyle}>
                {a.key}: {a.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </main>
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

const chipStyle: React.CSSProperties = {
  background: "#161f38",
  border: "1px solid #1f2940",
  borderRadius: "999px",
  padding: "0.35rem 0.7rem",
  color: "#d5def0",
  fontSize: "0.9rem"
};
