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
        <div className="ui-flex ui-justify-end ui-absolute ui-top-10 ui-right-10">
          <DialogClose className="ui-inline-flex">
            <CloseIcon className="ui-stroke-white/50 " />
          </DialogClose>
        </div>
        <RemoveAuthenticatorForm
          authenticator={authenticator}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
