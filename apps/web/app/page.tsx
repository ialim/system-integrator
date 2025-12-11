import { Box, Button, Grid, GridItem, Input, InputGroup, InputLeftElement, Stack, Text, Badge } from "@chakra-ui/react";
import { fetchProducts } from "../lib/products";

export default async function Home({
  searchParams
}: {
  searchParams?: { q?: string; category?: string; brand?: string };
}) {
  let data:
    | { items: Awaited<ReturnType<typeof fetchProducts>>["items"]; total: number }
    | null = null;
  let error: string | null = null;

  try {
    const res = await fetchProducts({
      limit: 12,
      q: searchParams?.q,
      category: searchParams?.category,
      brand: searchParams?.brand
    });
    data = { items: res.items, total: res.total };
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load products";
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      <Stack spacing="6">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="6">
          <Text letterSpacing="0.08em" fontSize="sm" color="var(--accent)" m="0">
            SYSTEM INTEGRATOR WHOLESALE
          </Text>
          <Text as="h1" fontSize="2xl" fontWeight="700" m="0.35rem 0 0.25rem">
            Wholesale + Project Designer
          </Text>
          <Text color="var(--muted)" m="0">
            Catalog feed from suppliers with pricing, availability, and quick BOM building.
          </Text>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction="row" justify="space-between" align="center" mb="4">
            <Box>
              <Text fontSize="lg" fontWeight="700">
                Catalog
              </Text>
              <Text color="var(--muted)">Filter by search, brand, and category</Text>
            </Box>
            <Text color="var(--accent)" fontWeight="600">
              {data ? `${data.total} items` : ""}
            </Text>
          </Stack>
          <FilterForm defaults={searchParams} />
          {error && <Text color="#f59e0b">{error}</Text>}
          <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="3" mt="3">
            {data?.items?.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
            {!data && !error && <Text color="var(--muted)">Loading products…</Text>}
          </Grid>
        </Box>
      </Stack>
    </main>
  );
}

function ProductCard({ product }: { product: any }) {
  const brand = product?.facets?.find((f: any) => f.key === "brand")?.value;
  return (
    <Box as="a" href={`/products/${encodeURIComponent(product.sku)}`} bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="4">
      <Stack spacing="2">
        <Stack direction="row" justify="space-between">
          <Text fontWeight="700">{product.name}</Text>
          <Text color="var(--accent)" fontSize="sm">
            {product.sku}
          </Text>
        </Stack>
        {brand && (
          <Text color="var(--muted)" fontSize="sm">
            {brand}
          </Text>
        )}
        {product.category && (
          <Text color="var(--muted)" fontSize="sm">
            {product.category}
          </Text>
        )}
        <Text color="#d5def0" fontSize="sm">
          {product.description?.slice(0, 140) || "No description"}
          {product.description && product.description.length > 140 ? "…" : ""}
        </Text>
        <Stack direction="row" justify="space-between" align="center">
          <Text color="var(--accent)" fontWeight="700">
            {product.currency || ""} {product.msrp || product.unit_cost || ""}
          </Text>
          {product.stock_band && (
            <Badge colorScheme="blue" variant="outline">
              {product.stock_band}
            </Badge>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function FilterForm({ defaults }: { defaults?: { q?: string; category?: string; brand?: string } }) {
  return (
    <form method="get">
      <Grid templateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="2">
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="var(--muted)">
            🔍
          </InputLeftElement>
          <Input name="q" defaultValue={defaults?.q || ""} placeholder="Search name/description" bg="var(--card)" borderColor="var(--border)" />
        </InputGroup>
        <Input name="brand" defaultValue={defaults?.brand || ""} placeholder="Brand (e.g., Golden Security)" bg="var(--card)" borderColor="var(--border)" />
        <Input name="category" defaultValue={defaults?.category || ""} placeholder="Category" bg="var(--card)" borderColor="var(--border)" />
        <Button type="submit" bg="var(--primary)" color="#fff">
          Apply
        </Button>
      </Grid>
    </form>
  );
}
