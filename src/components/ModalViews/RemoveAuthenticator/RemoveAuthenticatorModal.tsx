import React, { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../../ui";
import { RemoveAuthenticatorForm } from "./RemoveAuthenticatorForm";
import { Authenticator } from "../../../indexer-strategies/types";

export default function RemoveAuthenticatorModal({
  isOpen,
  setIsOpen,
  authenticator,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  authenticator?: Authenticator;
}) {
  return (
    <Dialog modal onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger className="ui-hidden"></DialogTrigger>
      <DialogContent
        onPointerDownOutside={(e: CustomEvent) => e.preventDefault()}
        closeButton
      >
        <RemoveAuthenticatorForm
          authenticator={authenticator}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
