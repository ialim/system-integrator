"use client";

import { Button, HStack } from "@chakra-ui/react";

export function ProposalActions() {
  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <HStack spacing="2" className="proposal-actions">
      <Button variant="outline" borderColor="var(--border)" color="var(--text)" onClick={handlePrint}>
        Export PDF
      </Button>
    </HStack>
  );
}
