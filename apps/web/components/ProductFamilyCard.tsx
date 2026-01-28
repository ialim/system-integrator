"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Button, HStack, Stack, Text, Image } from "@chakra-ui/react";
import Link from "next/link";
import type { Product, ProductFamily } from "../lib/products";

type Props = {
  family: ProductFamily;
  variants: Product[];
};

export function ProductFamilyCard({ family, variants }: Props) {
  const sortedVariants = useMemo(
    () =>
      [...variants].sort((a, b) => {
        const priceA = Number(a.msrp || a.unitCost || 0);
        const priceB = Number(b.msrp || b.unitCost || 0);
        return priceA - priceB;
      }),
    [variants]
  );
  const [selectedSku, setSelectedSku] = useState(sortedVariants[0]?.sku);
  const selected = sortedVariants.find((v) => v.sku === selectedSku) || sortedVariants[0];

  const price = selected?.msrp ?? selected?.unitCost ?? 0;
  const currency = selected?.currency || "NGN";
  const brand = selected?.facets?.find((f) => f.key === "brand")?.value || family.brand;
  const category = family.category || selected?.category;
  const placeholderImage = "/placeholder-product.svg";
  const mediaList = Array.isArray(selected?.media) ? selected?.media : [];
  const mediaUrl =
    selected?.imageUrl ||
    (typeof mediaList[0] === "string" ? mediaList[0] : mediaList[0]?.url) ||
    family.defaultImage ||
    placeholderImage;
  const variantOptions = sortedVariants.map((v) => ({
    sku: v.sku,
    label: v.variantFacets?.map((vf) => vf.value).join(" / ") || v.sku
  }));

  return (
    <Box bg="var(--card)" border="1px solid var(--border)" borderRadius="14px" p="4" display="flex" flexDirection="column" minH="340px">
      <Stack spacing="2" flex="1">
        <Box
          borderRadius="12px"
          overflow="hidden"
          border="1px solid var(--border)"
          bg="rgba(255,255,255,0.03)"
          h="130px"
          display="grid"
          placeItems="center"
        >
          <Image src={mediaUrl} alt={family.name} objectFit="cover" w="100%" h="100%" />
        </Box>
        <HStack justify="space-between" align="center">
          <Badge colorScheme="purple" variant="subtle">
            {category || "Uncategorized"}
          </Badge>
          <Badge colorScheme="blue" variant="outline">
            {brand || "Unknown brand"}
          </Badge>
        </HStack>
        <Text fontWeight="800" fontSize="lg">
          {family.name}
        </Text>
        <Text color="var(--muted)" fontSize="sm" noOfLines={3}>
          {selected?.description || family.description || "No description"}
        </Text>
        <Text color="var(--accent)" fontWeight="800" fontSize="lg">
          {currency} {Number(price).toLocaleString()}
        </Text>
        <Stack spacing="1">
          <Text fontSize="xs" color="var(--muted)">
            Select variant
          </Text>
          <HStack spacing="2" flexWrap="wrap">
            {variantOptions.map((v) => {
              const isActive = v.sku === selected?.sku;
              return (
                <Button
                  key={v.sku}
                  size="xs"
                  variant={isActive ? "solid" : "outline"}
                  borderColor="var(--border)"
                  color={isActive ? "#fff" : "var(--muted)"}
                  bg={isActive ? "var(--primary)" : "transparent"}
                  onClick={() => setSelectedSku(v.sku)}
                >
                  {v.label || v.sku}
                </Button>
              );
            })}
          </HStack>
        </Stack>
      </Stack>
      <Button
        as={Link}
        href={`/products/${encodeURIComponent(selected?.sku || sortedVariants[0]?.sku)}`}
        mt="3"
        bg="var(--primary)"
        color="#fff"
        _hover={{ bg: "#1f5ee0" }}
      >
        View & Add
      </Button>
    </Box>
  );
}
