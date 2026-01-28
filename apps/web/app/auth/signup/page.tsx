import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Input, Link, Stack, Text } from "@chakra-ui/react";

async function action(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const orgName = formData.get("orgName")?.toString() || "";
  const name = formData.get("name")?.toString() || "";
  if (!email || !password || !orgName) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, orgName, name })
  });

  if (!res.ok) {
    let msg = "Signup failed";
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore parse error
    }
    redirect(`/auth/signup?error=${encodeURIComponent(msg)}`);
  }
  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  if (data.refresh_token) {
    cookies().set("refresh_token", data.refresh_token, { httpOnly: true, path: "/" });
  }
  if (data.verification_token) {
    redirect(`/auth/verify?token=${encodeURIComponent(data.verification_token)}`);
  }
  redirect("/projects");
}

export default function SignupPage({ searchParams }: { searchParams?: { error?: string } }) {
  const googleUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/google`;
  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box as="form" action={action} w="100%" maxW="480px" bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5" display="grid" gap="3">
        <Text as="h1" fontSize="xl" fontWeight="700" m="0">
          Sign up
        </Text>
        <Text color="var(--muted)" m="0 0 2">
          Create your org to start building projects.
        </Text>
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">Org name</FormLabel>
            <Input name="orgName" type="text" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Email</FormLabel>
            <Input name="email" type="email" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Name (optional)</FormLabel>
            <Input name="name" type="text" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Password</FormLabel>
            <Input name="password" type="password" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Sign up
        </Button>
        <Button as={Link} href={googleUrl} variant="outline" borderColor="var(--border)" color="var(--text)" fontWeight="700">
          Continue with Google
        </Button>
        <Text color="var(--muted)" m="0">
          Have an account?{" "}
          <Link href="/auth/login" color="var(--accent)">
            Login
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
