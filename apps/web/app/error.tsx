"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="6" maxW="520px">
        <Stack spacing="3">
          <Text fontSize="lg" fontWeight="700" m="0">
            Something went wrong
          </Text>
          <Text color="var(--muted)" m="0">
            {error.message || "An unexpected error occurred."}
          </Text>
          <Button onClick={reset} bg="var(--primary)" color="#fff" alignSelf="flex-start">
            Try again
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
