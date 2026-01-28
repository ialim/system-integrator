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
  Text
} from "@chakra-ui/react";
import { EditIcon } from "./icons";
import { FormEvent, useState } from "react";

type Props = {
  currentName: string;
  action: (formData: FormData) => void;
};

export function RenameProjectModal({ currentName, action }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState(currentName);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        leftIcon={<EditIcon />}
        borderColor="var(--border)"
        color="var(--text)"
        onClick={() => {
          setName(currentName);
          onOpen();
        }}
      >
        Rename
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
            <ModalHeader>Rename project</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing="2">
                <Text color="var(--muted)" fontSize="sm">
                  Update the project name to keep quotes and BOMs organized.
                </Text>
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  bg="var(--card)"
                  borderColor="var(--border)"
                  _placeholder={{ color: "var(--muted)" }}
                  required
                />
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
