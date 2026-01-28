import { Box, Button, FormControl, FormLabel, Input, Stack, Text, Link } from "@chakra-ui/react";
import { redirect } from "next/navigation";

async function action(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString() || "";
  if (!email) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  if (!res.ok) {
    redirect(`/auth/forgot?error=${encodeURIComponent("Request failed")}`);
  }

  const data = await res.json();
  if (data.reset_token) {
    redirect(`/auth/reset?token=${encodeURIComponent(data.reset_token)}`);
  }
  redirect(`/auth/forgot?sent=1`);
}

export default function ForgotPasswordPage({ searchParams }: { searchParams?: { sent?: string; error?: string } }) {
  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box
        as="form"
        action={action}
        w="100%"
        maxW="420px"
        bg="var(--panel)"
        border="1px solid var(--border)"
        borderRadius="14px"
        p="5"
        gap="3"
        display="grid"
      >
        <Text as="h1" fontSize="xl" fontWeight="700" m="0 0 2">
          Reset password
        </Text>
        <Text color="var(--muted)" m="0 0 3">
          Enter your email to receive a reset link.
        </Text>
        {searchParams?.sent && (
          <Text color="var(--accent)" m="0">
            Check your email for a reset link.
          </Text>
        )}
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">Email</FormLabel>
            <Input name="email" type="email" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Send reset link
        </Button>
        <Text color="var(--muted)" m="0">
          Remember your password?{" "}
          <Link href="/auth/login" color="var(--accent)">
            Login
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
