import { Box, Button, Stack, Text, Link } from "@chakra-ui/react";

export default async function VerifyEmailPage({ searchParams }: { searchParams?: { token?: string } }) {
  const token = searchParams?.token || "";
  let message = "Missing verification token.";
  let success = false;

  if (token) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (res.ok) {
      message = "Email verified successfully.";
      success = true;
    } else {
      try {
        const body = await res.json();
        message = body?.message || "Verification failed.";
      } catch {
        message = "Verification failed.";
      }
    }
  }

  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5" maxW="480px" w="100%">
        <Stack spacing="3">
          <Text fontSize="lg" fontWeight="700">
            Email verification
          </Text>
          <Text color={success ? "var(--accent)" : "var(--muted)"}>{message}</Text>
          <Button as={Link} href="/projects" variant="outline" borderColor="var(--border)" color="var(--text)">
            Continue
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
