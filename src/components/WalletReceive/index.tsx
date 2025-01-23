import React, { ReactElement, useState } from "react";
import {
  Button,
  CloseIcon,
  Dialog,
  DialogClose,
  DialogContent,
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
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        className="ui-text-white ui-p-12"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="ui-flex ui-justify-end ui-absolute ui-top-6 ui-right-6">
          <DialogClose className="ui-inline-flex">
            <CloseIcon className="ui-stroke-white/50 " />
          </DialogClose>
        </div>

        <div className="ui-flex ui-flex-col ui-gap-10">
          <h1 className="ui-w-full ui-text-center ui-text-[32px] ui-leading-[120%] ui-font-thin">
            RECEIVE
          </h1>
          <div className="ui-flex ui-flex-col ui-gap-6">
            <h3 className="ui-text-white ui-text-sm ui-font-bold ui-leading-none">
              XION Address
            </h3>
            <CopyAddress xionAddress={xionAddress} />
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
