"use client";

import type { ElementType } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, HStack, Stack, Text, Button, Avatar, Badge, Icon } from "@chakra-ui/react";
import {
  AddIcon,
  CalendarIcon,
  CheckCircleIcon,
  DragHandleIcon,
  ExternalLinkIcon,
  SettingsIcon,
  StarIcon
} from "./icons";

type SidebarProps = {
  user?: { email?: string | null; role?: string | null; name?: string | null } | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: ElementType;
  disabled?: boolean;
  badge?: string;
  match?: string;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "#", icon: CalendarIcon, disabled: true },
  { label: "Configurator", href: "#", icon: StarIcon, disabled: true },
  { label: "Product Catalog", href: "/", icon: ExternalLinkIcon, match: "/products" },
  { label: "Project Builder", href: "/projects", icon: DragHandleIcon, match: "/projects" },
  { label: "Orders", href: "#", icon: CheckCircleIcon, disabled: true },
  { label: "Clients", href: "#", icon: AddIcon, disabled: true },
  { label: "Settings", href: "#", icon: SettingsIcon, disabled: true }
];

const adminNav: NavItem[] = [
  { label: "Catalog", href: "#", icon: StarIcon, disabled: true },
  { label: "Orders", href: "#", icon: CheckCircleIcon, disabled: true },
  { label: "Inventory", href: "#", icon: AddIcon, disabled: true }
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Box
      as="aside"
      width="250px"
      borderRight="1px solid"
      borderColor="var(--border)"
      bg="var(--panel)"
      p="18px 16px"
      display={{ base: "none", lg: "block" }}
      boxShadow="0px 8px 32px rgba(0,0,0,0.35)"
    >
      <Stack spacing="5" height="100%">
        <Flex align="center" justify="space-between" px="2">
          <HStack spacing="3" align="center">
            <Box
              width="36px"
              height="36px"
              borderRadius="12px"
              bg="linear-gradient(135deg, #2d6bff, #7bb5ff)"
              display="grid"
              placeItems="center"
              boxShadow="0 10px 30px rgba(45,107,255,0.28)"
            >
              <Text fontWeight="800" fontSize="lg">
                SI
              </Text>
            </Box>
            <Stack spacing="0" lineHeight="1.2">
              <Text fontWeight="800">SmartIntegrate</Text>
              <Text fontSize="xs" color="var(--muted)">
                Workspace
              </Text>
            </Stack>
          </HStack>
          <Badge bg="rgba(255,255,255,0.06)" color="var(--accent)" borderRadius="full" px="2" py="1">
            Beta
          </Badge>
        </Flex>

        <NavSection title="Main" items={mainNav} pathname={pathname} />
        <NavSection title="Admin" items={adminNav} pathname={pathname} />

        <Box flex="1" />

        <Stack spacing="3" borderTop="1px solid" borderColor="var(--border)" pt="3">
          <HStack spacing="3" align="center">
            <Avatar name={user?.email || "Integrator"} size="sm" bg="#1f2d4a" color="#eaf1ff" />
            <Stack spacing="0">
              <Text fontWeight="700" fontSize="sm">
                {user?.name || user?.email || "Estimator"}
              </Text>
              <Text fontSize="xs" color="var(--muted)">
                {user?.role ? user.role.toLowerCase() : "Guest"}
              </Text>
            </Stack>
          </HStack>
          <Button
            as={NextLink}
            href="/auth/login"
            size="sm"
            variant="ghost"
            color="var(--text)"
            border="1px solid"
            borderColor="var(--border)"
          >
            Sign out
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function NavSection({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <Stack spacing="2">
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="var(--muted)" px="2">
        {title}
      </Text>
      <Stack spacing="1">
        {items.map((item) => {
          const isActive = item.disabled ? false : pathname.startsWith(item.match || item.href);
          return (
            <NavLink
              key={item.label}
              href={item.href}
              icon={item.icon}
              label={item.label}
              disabled={item.disabled}
              active={isActive}
              badge={item.badge}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

function NavLink({
  href,
  label,
  icon: IconEl,
  disabled,
  active,
  badge
}: {
  href: string;
  label: string;
  icon: ElementType;
  disabled?: boolean;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Button
      as={disabled ? "button" : (NextLink as any)}
      href={disabled ? undefined : href}
      justifyContent="space-between"
      variant="ghost"
      color={active ? "#fff" : "var(--muted)"}
      bg={active ? "rgba(45,107,255,0.18)" : "transparent"}
      _hover={{ bg: disabled ? "transparent" : "rgba(255,255,255,0.04)", color: "#fff" }}
      size="sm"
      fontWeight="600"
      borderRadius="10px"
      px="3"
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.55 : 1}
      leftIcon={<Icon as={IconEl} boxSize="4" />}
      rightIcon={badge ? <Badge bg="var(--border)" color="var(--text)" borderRadius="6px">{badge}</Badge> : undefined}
    >
      <HStack spacing="2">
        <Text>{label}</Text>
      </HStack>
    </Button>
  );
}
