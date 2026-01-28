import { Box, Button, Grid, Input, InputGroup, InputLeftElement, Stack, Text, Badge, HStack, Select } from "@chakra-ui/react";
import Link from "next/link";
import { SearchIcon } from "../components/icons";
import { fetchProducts, fetchProductFamilies, Product, ProductFamily } from "../lib/products";
import { ProductFamilyCard } from "../components/ProductFamilyCard";

type SearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  offset?: string;
  limit?: string;
  sort?: string;
  dir?: string;
  facet?: string | string[];
};

export default async function Home({ searchParams }: { searchParams?: SearchParams }) {
  const limit = searchParams?.limit ? Number(searchParams.limit) : 20;
  const offset = searchParams?.offset ? Number(searchParams.offset) : 0;
  const categoryFilter = searchParams?.category || "";
  const sort = searchParams?.sort || "name";
  const dir = searchParams?.dir || "asc";
  const activeFacetValues = parseFacetValues(searchParams?.facet);
  const activeFacets = activeFacetValues
    .map(parseFacetEntry)
    .filter((value): value is { key: string; value: string } => Boolean(value));

  let families: Array<{ family: ProductFamily; variants: Product[] }> = [];
  let productsFallback: Product[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await fetchProductFamilies({
      q: searchParams?.q,
      brand: searchParams?.brand,
      category: categoryFilter || undefined,
      facets: activeFacetValues
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
        brand: searchParams?.brand,
        sort,
        dir,
        facets: activeFacetValues
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

  const sortKey = sort.toLowerCase();
  const sortDir = dir.toLowerCase() === "desc" ? -1 : 1;
  const sortedFamiliesToRender = [...familiesToRender].sort((a, b) => {
    if (sortKey === "price") {
      const priceA = Math.min(...a.variants.map((v) => Number(v.msrp ?? v.unitCost ?? 0)));
      const priceB = Math.min(...b.variants.map((v) => Number(v.msrp ?? v.unitCost ?? 0)));
      return (priceA - priceB) * sortDir;
    }
    if (sortKey === "leadtime") {
      const leadA = Math.min(...a.variants.map((v) => Number(v.leadTimeDays ?? Number.POSITIVE_INFINITY)));
      const leadB = Math.min(...b.variants.map((v) => Number(v.leadTimeDays ?? Number.POSITIVE_INFINITY)));
      return (leadA - leadB) * sortDir;
    }
    if (sortKey === "created") {
      const createdA = Math.min(...a.variants.map((v) => Number(v.id ?? Number.POSITIVE_INFINITY)));
      const createdB = Math.min(...b.variants.map((v) => Number(v.id ?? Number.POSITIVE_INFINITY)));
      return (createdA - createdB) * sortDir;
    }
    const nameA = a.family.name.toLowerCase();
    const nameB = b.family.name.toLowerCase();
    return nameA.localeCompare(nameB) * sortDir;
  });

  const brandSet = new Set<string>();
  familiesToRender.forEach((group) => {
    if (group.family.brand) {
      brandSet.add(group.family.brand);
    }
    group.variants.forEach((variant) => {
      const brand = variant.facets?.find((f) => f.key === "brand")?.value;
      if (brand) {
        brandSet.add(brand);
      }
    });
  });
  const brands = Array.from(brandSet.values()).sort((a, b) => a.localeCompare(b));

  const facetMap = new Map<string, Set<string>>();
  const addFacetList = (list?: Array<{ key: string; value: string }>) => {
    if (!list) return;
    list.forEach((facet) => {
      if (!facet?.key || !facet?.value) return;
      const key = facet.key.trim();
      const value = facet.value.trim();
      if (!key || !value) return;
      if (!facetMap.has(key)) {
        facetMap.set(key, new Set<string>());
      }
      facetMap.get(key)!.add(value);
    });
  };
  familiesToRender.forEach((group) => {
    group.variants.forEach((variant) => {
      addFacetList(variant.facets);
      addFacetList(variant.variantFacets);
    });
  });
  activeFacets.forEach((facet) => {
    addFacetList([facet]);
  });
  const facetGroups = Array.from(facetMap.entries())
    .filter(([key]) => key.toLowerCase() !== "brand")
    .map(([key, values]) => ({
      key,
      values: Array.from(values).sort((a, b) => a.localeCompare(b)).slice(0, 6)
    }))
    .slice(0, 4);

  const buildHref = (updates: Record<string, string | null | undefined>, nextFacets?: string[]) => {
    const params = new URLSearchParams();
    if (searchParams?.q) params.set("q", searchParams.q);
    if (searchParams?.brand) params.set("brand", searchParams.brand);
    if (searchParams?.sort) params.set("sort", searchParams.sort);
    if (searchParams?.dir) params.set("dir", searchParams.dir);
    if (searchParams?.limit) params.set("limit", searchParams.limit);
    const facetValues = nextFacets ?? activeFacetValues;
    facetValues.forEach((facet) => params.append("facet", facet));

    const categoryValue = updates.category !== undefined ? updates.category : searchParams?.category;
    if (categoryValue) params.set("category", categoryValue);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return;
      params.delete(key);
      if (value !== null && value !== "") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  const mainContent = (
    <Stack spacing="4">
      <CategoryFilters categories={categories} active={categoryFilter} buildHref={buildHref} />
      <FilterForm
        defaults={searchParams}
        brands={brands}
        sort={sort}
        dir={dir}
        activeFacets={activeFacetValues}
        category={categoryFilter}
      />
      {error && <Text color="#f59e0b">{error}</Text>}
      <Grid templateColumns="repeat(auto-fill, minmax(260px, 320px))" gap="4" justifyContent="flex-start">
        {sortedFamiliesToRender.map((fam) => (
          <ProductFamilyCard key={`${fam.family.name}-${fam.family.brand || ""}`} family={fam.family} variants={fam.variants} />
        ))}
        {!sortedFamiliesToRender.length && !error && <Text color="var(--muted)">No products found.</Text>}
      </Grid>
    </Stack>
  );

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
          {facetGroups.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", lg: "240px 1fr" }} gap="4" alignItems="start">
              <Stack spacing="3">
                <Text fontSize="xs" color="var(--muted)" letterSpacing="0.08em">
                  FACET FILTERS
                </Text>
                <FacetFilters groups={facetGroups} active={activeFacetValues} buildHref={buildHref} />
              </Stack>
              {mainContent}
            </Grid>
          ) : (
            mainContent
          )}
        </Box>
      </Stack>
    </main>
  );
}

function FilterForm({
  defaults,
  brands,
  sort,
  dir,
  activeFacets,
  category
}: {
  defaults?: SearchParams;
  brands: string[];
  sort: string;
  dir: string;
  activeFacets: string[];
  category: string;
}) {
  return (
    <form method="get">
      <Stack spacing="3">
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="var(--muted)">
            <SearchIcon />
          </InputLeftElement>
          <Input name="q" defaultValue={defaults?.q || ""} placeholder="Search products..." bg="var(--card)" borderColor="var(--border)" />
        </InputGroup>
        <HStack spacing="3" flexWrap="wrap">
          <Select name="brand" defaultValue={defaults?.brand || ""} maxW="220px" bg="var(--card)" borderColor="var(--border)">
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={sort} maxW="200px" bg="var(--card)" borderColor="var(--border)">
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="leadTime">Lead time</option>
            <option value="created">Recently added</option>
          </Select>
          <Select name="dir" defaultValue={dir} maxW="160px" bg="var(--card)" borderColor="var(--border)">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </Select>
          <Button type="submit" bg="var(--primary)" color="#fff">
            Apply
          </Button>
        </HStack>
        {category && <input type="hidden" name="category" value={category} />}
        {activeFacets.map((facet) => (
          <input key={facet} type="hidden" name="facet" value={facet} />
        ))}
      </Stack>
    </form>
  );
}

function CategoryFilters({
  categories,
  active,
  buildHref
}: {
  categories: string[];
  active: string;
  buildHref: (updates: Record<string, string | null | undefined>, nextFacets?: string[]) => string;
}) {
  const pills = ["All", ...categories];
  return (
    <HStack spacing="2" flexWrap="wrap">
      {pills.map((cat) => {
        const isAll = cat === "All";
        const isActive = (isAll && !active) || (!isAll && active && active.toLowerCase() === cat.toLowerCase());
        const href = isAll ? buildHref({ category: null }) : buildHref({ category: cat });
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

function FacetFilters({
  groups,
  active,
  buildHref
}: {
  groups: Array<{ key: string; values: string[] }>;
  active: string[];
  buildHref: (updates: Record<string, string | null | undefined>, nextFacets?: string[]) => string;
}) {
  return (
    <Stack spacing="3">
      {groups.map((group) => (
        <Stack key={group.key} spacing="1">
          <Text fontSize="xs" color="var(--muted)" letterSpacing="0.08em">
            {group.key.toUpperCase()}
          </Text>
          <HStack spacing="2" flexWrap="wrap">
            {group.values.map((value) => {
              const facetValue = `${group.key}:${value}`;
              const isActive = active.includes(facetValue);
              const nextFacets = isActive ? active.filter((item) => item !== facetValue) : [...active, facetValue];
              return (
                <Button
                  key={facetValue}
                  as={Link}
                  href={buildHref({}, nextFacets)}
                  size="xs"
                  variant={isActive ? "solid" : "outline"}
                  borderColor="var(--border)"
                  color={isActive ? "#fff" : "var(--muted)"}
                  bg={isActive ? "rgba(45,107,255,0.18)" : "transparent"}
                  _hover={{ bg: "rgba(255,255,255,0.05)", color: "#fff" }}
                >
                  {value}
                </Button>
              );
            })}
          </HStack>
        </Stack>
      ))}
    </Stack>
  );
}

function parseFacetValues(facetParam?: string | string[]) {
  const entries = Array.isArray(facetParam) ? facetParam : facetParam ? [facetParam] : [];
  return entries
    .map((entry) => entry.trim())
    .filter((entry) => Boolean(parseFacetEntry(entry)))
    .filter((entry, index, self) => self.indexOf(entry) === index);
}

function parseFacetEntry(entry: string) {
  const idx = entry.indexOf(":");
  if (idx <= 0) return null;
  const key = entry.slice(0, idx).trim();
  const value = entry.slice(idx + 1).trim();
  if (!key || !value) return null;
  return { key, value };
}
