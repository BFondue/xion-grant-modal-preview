import React, { ReactElement, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui";
import { CopyAddress } from "../CopyAddress";

export function WalletReceive({
  trigger,
  xionAddress,
}: {
  trigger: ReactElement;
  xionAddress: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="ui-text-white ui-p-12"
        onPointerDownOutside={(e) => e.preventDefault()}
        closeButton
      >
        <DialogHeader>
          <DialogTitle>Receive XION</DialogTitle>
          <DialogDescription>
            Copy the XION address below to receive.
          </DialogDescription>
        </DialogHeader>
        <div className="ui-flex ui-flex-col ui-gap-10">
          <div className="ui-flex ui-flex-col ui-gap-6">
            <CopyAddress
              xionAddress={xionAddress}
              className="ui-w-full ui-h-14 ui-text-sm ui-font-bold ui-leading-none ui-rounded-lg ui-justify-between ui-items-center ui-bg-white/[0.05] ui-px-4 ui-py-2"
              iconHeight={14}
              iconWidth={12}
            />
          </div>
          <Button
            className="ui-mt-2"
            onClick={() => setIsOpen(false)}
            fullWidth
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
