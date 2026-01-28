"use client";

import { Button, ButtonProps } from "@chakra-ui/react";
import { FormEvent, ReactNode } from "react";

type Props = {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: ReactNode;
} & Omit<ButtonProps, "type">;

export function ConfirmActionButton({ action, confirmMessage, children, ...buttonProps }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      style={{ margin: 0 }}
    >
      <Button type="submit" {...buttonProps}>
        {children}
      </Button>
    </form>
  );
}
