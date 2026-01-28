import { Box, Button, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="6" maxW="520px">
        <Stack spacing="3">
          <Text fontSize="lg" fontWeight="700" m="0">
            Page not found
          </Text>
          <Text color="var(--muted)" m="0">
            The page you are looking for does not exist or moved.
          </Text>
          <Button as={Link} href="/" bg="var(--primary)" color="#fff" alignSelf="flex-start">
            Go home
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
