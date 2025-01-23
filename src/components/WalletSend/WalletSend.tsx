import React, { ReactElement, useState } from "react";
import { WalletSendForm } from "./WalletSendForm";
import {
  CloseIcon,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../ui";

export function WalletSend({ trigger }: { trigger: ReactElement }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        className="ui-text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="ui-flex ui-justify-end ui-absolute ui-top-6 ui-right-6">
          <DialogClose className="ui-inline-flex">
            <CloseIcon className="ui-stroke-white " />
          </DialogClose>
        </div>

        <WalletSendForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}
