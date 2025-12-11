import { Box, Button, Flex, HStack, Link, Text } from "@chakra-ui/react";

export function Header() {
  return (
    <Flex
      as="header"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="14px"
      p="3"
      bg="var(--panel)"
      align="center"
      justify="space-between"
      mb="4"
    >
      <HStack spacing="3" align="center">
        <Text color="var(--accent)" letterSpacing="0.08em" fontWeight="700">
          INTEGRATOR
        </Text>
        <Link href="/" color="var(--text)" fontWeight="600">
          Catalog
        </Link>
        <Link href="/projects" color="var(--text)" fontWeight="600">
          Projects
        </Link>
      </HStack>
      <HStack spacing="2">
        <Link href="/auth/login" color="var(--muted)" fontWeight="600">
          Login
        </Link>
        <Button as={Link} href="/auth/signup" size="sm" bg="var(--primary)" color="#fff" fontWeight="700">
          Sign up
        </Button>
      </HStack>
    </Flex>
  );
}
