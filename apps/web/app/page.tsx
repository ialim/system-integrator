import { Box, Button, Grid, Input, InputGroup, InputLeftElement, Stack, Text, Badge, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { SearchIcon } from "../components/icons";
import { fetchProducts, fetchProductFamilies, Product, ProductFamily } from "../lib/products";
import { ProductFamilyCard } from "../components/ProductFamilyCard";

export default async function Home({
  searchParams
}: {
  searchParams?: { q?: string; category?: string; brand?: string; offset?: string; limit?: string };
}) {
  const limit = searchParams?.limit ? Number(searchParams.limit) : 20;
  const offset = searchParams?.offset ? Number(searchParams.offset) : 0;
  const categoryFilter = searchParams?.category || "";

  let families: Array<{ family: ProductFamily; variants: Product[] }> = [];
  let productsFallback: Product[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await fetchProductFamilies({
      q: searchParams?.q,
      brand: searchParams?.brand
    });
    families = res.items;
    total = families.length;
  } catch {
    // fall back to flat products if family endpoint fails
    try {
      const res = await fetchProducts({
        limit,
        offset,
        q: searchParams?.q,
        category: categoryFilter || undefined,
        brand: searchParams?.brand
      });
      productsFallback = res.items;
      total = res.total;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load products";
    }
  }

  const categories =
    families.length > 0
      ? Array.from(
          new Set(
            families
              .map((f) => f.family.category || f.variants[0]?.category)
              .filter(Boolean)
              .map((c) => c as string)
          )
        )
      : Array.from(new Set(productsFallback.map((p) => p.category || "").filter(Boolean)));
  const filteredFamilies = categoryFilter
    ? families.filter((f) => (f.family.category || f.variants[0]?.category || "").toLowerCase() === categoryFilter.toLowerCase())
    : families;

  const familiesToRender =
    filteredFamilies.length > 0
      ? filteredFamilies
      : productsFallback.length
      ? productsFallback.map((p) => ({
          family: {
            id: p.familyId || null,
            name: p.family?.name || p.name,
            brand: p.facets?.find((f) => f.key === "brand")?.value || null,
            category: p.category || null,
            description: p.description,
            defaultImage: null,
            attributes: p.variantFacets || null
          },
          variants: [p]
        }))
      : [];

  return (
    <main style={{ minHeight: "100vh" }}>
      <Stack spacing="6">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="6" className="glow-card">
          <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }}>
            <Stack spacing="1">
              <Text letterSpacing="0.08em" fontSize="sm" color="var(--accent)" m="0">
                PRODUCT CATALOG
              </Text>
              <Text as="h1" fontSize="2xl" fontWeight="800" m="0.35rem 0 0.25rem">
                Browse and add wholesale products to your projects.
              </Text>
              <Text color="var(--muted)" m="0">
                Search by name, filter by category, and pick variants before adding.
              </Text>
            </Stack>
            <Text color="var(--accent)" fontWeight="700">
              {total ? `${total} items` : ""}
            </Text>
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="4">
            <HStack justify="space-between" align="center">
              <CategoryFilters categories={categories} active={categoryFilter} />
              <Box minW="260px">
                <FilterForm defaults={searchParams} />
              </Box>
            </HStack>
            {error && <Text color="#f59e0b">{error}</Text>}
            <Grid templateColumns="repeat(auto-fill, minmax(260px, 320px))" gap="4" justifyContent="flex-start">
              {familiesToRender.map((fam) => (
                <ProductFamilyCard key={`${fam.family.name}-${fam.family.brand || ""}`} family={fam.family} variants={fam.variants} />
              ))}
              {!familiesToRender.length && !error && <Text color="var(--muted)">No products found.</Text>}
            </Grid>
          </Stack>
        </Box>
      </Stack>
    </main>
  );
}

function FilterForm({ defaults }: { defaults?: { q?: string; category?: string; brand?: string } }) {
  return (
    <form method="get">
      <InputGroup>
        <InputLeftElement pointerEvents="none" color="var(--muted)">
          <SearchIcon />
        </InputLeftElement>
        <Input name="q" defaultValue={defaults?.q || ""} placeholder="Search products..." bg="var(--card)" borderColor="var(--border)" />
      </InputGroup>
    </form>
  );
}

function CategoryFilters({ categories, active }: { categories: string[]; active: string }) {
  const pills = ["All", ...categories];
  return (
    <HStack spacing="2" flexWrap="wrap">
      {pills.map((cat) => {
        const isAll = cat === "All";
        const isActive = (isAll && !active) || (!isAll && active && active.toLowerCase() === cat.toLowerCase());
        const href = isAll ? "/" : `/?category=${encodeURIComponent(cat)}`;
        return (
          <Button
            key={cat}
            as={Link}
            href={href}
            size="sm"
            variant={isActive ? "solid" : "outline"}
            bg={isActive ? "rgba(45,107,255,0.18)" : "transparent"}
            color={isActive ? "#fff" : "var(--muted)"}
            borderColor="var(--border)"
            _hover={{ bg: "rgba(255,255,255,0.05)", color: "#fff" }}
          >
            {cat}
          </Button>
        );
      })}
    </HStack>
  );
}
