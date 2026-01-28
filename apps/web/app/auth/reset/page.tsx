import { Box, Button, FormControl, FormLabel, Input, Stack, Text, Link } from "@chakra-ui/react";
import { redirect } from "next/navigation";

async function action(formData: FormData) {
  "use server";
  const token = formData.get("token")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  if (!token || !password) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });

  if (!res.ok) {
    let msg = "Reset failed";
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore parse error
    }
    redirect(`/auth/reset?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`);
  }

  redirect(`/auth/login?reset=1`);
}

export default function ResetPasswordPage({ searchParams }: { searchParams?: { token?: string; error?: string } }) {
  const token = searchParams?.token || "";
  if (!token) {
    return (
      <Box as="main" display="grid" placeItems="center" minH="80vh">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Text fontSize="lg" fontWeight="700">
            Missing reset token
          </Text>
          <Text color="var(--muted)">Request a new password reset link.</Text>
        </Box>
      </Box>
    );
  }

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
          Set a new password
        </Text>
        <Text color="var(--muted)" m="0 0 3">
          Choose a strong password to secure your account.
        </Text>
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <input type="hidden" name="token" value={token} />
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">New password</FormLabel>
            <Input name="password" type="password" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Update password
        </Button>
        <Text color="var(--muted)" m="0">
          Back to{" "}
          <Link href="/auth/login" color="var(--accent)">
            login
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
