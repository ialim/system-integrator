/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useMemo, useState } from "react";
import { debounce } from "../lib/debounce";
import { fetchProducts, Product } from "../lib/products";
import { Box, Button, Input, Stack, Text, HStack, Badge, Select, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon } from "./icons";

type Props = {
  onSelect: (productId: number, qty: number) => void | Promise<void>;
  defaultQty?: number;
  variant?: "list" | "grid";
  showQtyControl?: boolean;
};

export function ProductSelector({ onSelect, defaultQty = 1, variant = "grid", showQtyControl = true }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(defaultQty);

  const runSearch = useMemo(
    () =>
      debounce(async (term: string) => {
        if (!term.trim()) {
          setResults([]);
          return;
        }
        setLoading(true);
        try {
          const data = await fetchProducts({ q: term, limit: 5 });
          setResults(data.items);
        } finally {
          setLoading(false);
        }
      }, 250),
    []
  );

  return (
    <Stack spacing="3">
      <InputGroup>
        <InputLeftElement pointerEvents="none" color="var(--muted)">
          <SearchIcon />
        </InputLeftElement>
        <Input
          placeholder="Search products by name, SKU or description"
          value={query}
          onChange={(e) => {
            const term = e.target.value;
            setQuery(term);
            runSearch(term);
          }}
          bg="var(--card)"
          borderColor="var(--border)"
          _focusVisible={{ borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary)" }}
        />
      </InputGroup>
      {showQtyControl && (
        <HStack spacing="2">
          <Select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            maxW="120px"
            bg="var(--card)"
            borderColor="var(--border)"
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                Qty {n}
              </option>
            ))}
          </Select>
          <Text color="var(--muted)">{loading ? "Searching..." : results.length ? `${results.length} results` : ""}</Text>
        </HStack>
      )}
      <Stack spacing="2">
        {!loading && query && results.length === 0 && (
          <Text color="var(--muted)" fontSize="sm">
            No products found for "{query}".
          </Text>
        )}
        {!query && results.length === 0 && (
          <Text color="var(--muted)" fontSize="sm">
            Start typing to search the catalog.
          </Text>
        )}
        {results.map((p) => {
          const brand = p.facets?.find((f) => f.key === "brand")?.value;
          const price = p.msrp || p.unitCost;
          const familyName = p.family?.name;
          return (
            <Box
              key={p.sku}
              border="1px solid var(--border)"
              borderRadius="10px"
              p="3"
              bg="rgba(255,255,255,0.02)"
              _hover={{ borderColor: "var(--accent)" }}
            >
              <HStack justify="space-between" align="start" alignItems="center">
                <Box>
                  <Text fontWeight="700">
                    {p.name} ({p.sku})
                  </Text>
                  {familyName && (
                    <Text color="var(--muted)" fontSize="xs">
                      Variant of {familyName}
                    </Text>
                  )}
                  {brand && (
                    <Text color="var(--muted)" fontSize="sm">
                      {brand}
                    </Text>
                  )}
                  <Text color="var(--muted)" fontSize="sm">
                    {p.category || "Uncategorized"}
                  </Text>
                  <HStack spacing="1" flexWrap="wrap">
                    {p.facets?.slice(0, variant === "list" ? 2 : 3).map((f) => (
                      <Badge key={`${p.sku}-${f.key}-${f.value}`} colorScheme="blue" variant="outline">
                        {f.key}: {f.value}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                <Stack align="flex-end" spacing="1">
                  <Text color="var(--accent)" fontWeight="700" fontSize="sm">
                    {price ? `${p.currency || ""} ${price}` : "n/a"}
                  </Text>
                  <Button size="sm" bg="var(--primary)" color="#fff" onClick={() => onSelect(p.id!, qty)}>
                    Add
                  </Button>
                </Stack>
              </HStack>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
