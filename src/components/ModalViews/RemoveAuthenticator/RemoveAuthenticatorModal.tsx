import React, { Dispatch, SetStateAction } from "react";
import { CloseIcon, Dialog, DialogClose, DialogContent } from "../../ui";
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
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent
        className="ui-text-white"
        onPointerDownOutside={(e: CustomEvent) => e.preventDefault()}
      >
        <DialogClose className="ui-absolute ui-top-5 ui-right-10">
          <CloseIcon className="ui-stroke-white/50" />
        </DialogClose>
        <RemoveAuthenticatorForm
          authenticator={authenticator}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
