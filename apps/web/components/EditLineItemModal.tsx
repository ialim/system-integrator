"use client";

import { useDisclosure } from "@chakra-ui/react";
import {
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea
} from "@chakra-ui/react";
import { EditIcon } from "./icons";
import { FormEvent, useState } from "react";

type Props = {
  currentNotes?: string | null;
  currentUnitPrice?: number | string | null;
  action: (formData: FormData) => void;
};

export function EditLineItemModal({ currentNotes, currentUnitPrice, action }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [unitPrice, setUnitPrice] = useState(
    currentUnitPrice !== null && currentUnitPrice !== undefined ? String(currentUnitPrice) : ""
  );

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<EditIcon />}
        color="var(--muted)"
        onClick={() => {
          setNotes(currentNotes ?? "");
          setUnitPrice(
            currentUnitPrice !== null && currentUnitPrice !== undefined ? String(currentUnitPrice) : ""
          );
          onOpen();
        }}
      >
        Edit
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px">
          <form
            action={action}
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              onClose();
            }}
          >
            <ModalHeader>Edit line item</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing="3">
                <Stack spacing="1">
                  <Text color="var(--muted)" fontSize="sm">
                    Price override (optional)
                  </Text>
                  <Input
                    name="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="Leave blank to use catalog price"
                    bg="var(--card)"
                    borderColor="var(--border)"
                    _placeholder={{ color: "var(--muted)" }}
                  />
                </Stack>
                <Stack spacing="1">
                  <Text color="var(--muted)" fontSize="sm">
                    Notes
                  </Text>
                  <Textarea
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add installation notes or context"
                    bg="var(--card)"
                    borderColor="var(--border)"
                    _placeholder={{ color: "var(--muted)" }}
                    resize="vertical"
                  />
                </Stack>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing="3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" bg="var(--primary)" color="#fff">
                  Save
                </Button>
              </HStack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
