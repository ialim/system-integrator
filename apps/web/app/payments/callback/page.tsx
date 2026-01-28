import { Box, Button, Stack, Text, Link } from "@chakra-ui/react";
import { verifyPaystackPayment } from "../../../lib/orders";

export default async function PaymentCallbackPage({ searchParams }: { searchParams?: { reference?: string } }) {
  const reference = searchParams?.reference || "";
  let message = "Missing payment reference.";
  let success = false;

  if (reference) {
    try {
      const result = await verifyPaystackPayment(reference);
      const status = String(result.status || "").toUpperCase();
      if (status === "SUCCESS") {
        success = true;
        message = "Payment confirmed. Your order is now marked as accepted.";
      } else if (status) {
        message = `Payment status: ${status}.`;
      } else {
        message = "Payment verification returned an unknown status.";
      }
    } catch (err) {
      message = err instanceof Error ? err.message : "Payment verification failed.";
    }
  }

  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5" maxW="480px" w="100%">
        <Stack spacing="3">
          <Text fontSize="lg" fontWeight="700">
            Payment callback
          </Text>
          <Text color={success ? "var(--accent)" : "var(--muted)"}>{message}</Text>
          <Button as={Link} href="/projects" variant="outline" borderColor="var(--border)" color="var(--text)">
            Back to projects
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
