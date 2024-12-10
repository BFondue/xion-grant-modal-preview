import React, { ReactElement, useState } from "react";
import {
  Button,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../ui";
import { truncateAddress } from "../../utils";

export function WalletReceive({
  trigger,
  xionAddress,
}: {
  trigger: ReactElement;
  xionAddress: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyXionAddress = () => {
    if (xionAddress) {
      navigator.clipboard.writeText(xionAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        className="ui-text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="ui-flex ui-justify-end ui-mt-8">
          <DialogClose className="ui-inline-flex">
            <CloseIcon className="ui-stroke-white/50" />
          </DialogClose>
        </div>

        <div className="ui-flex ui-flex-col">
          <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
            RECEIVE
          </h1>
          <h3 className="ui-text-white ui-text-sm ui-font-bold ui-font-akkuratLL ui-leading-none ui-my-6">
            XION Address
          </h3>
          <div
            onClick={copyXionAddress}
            className="ui-flex ui-cursor-pointer ui-items-center ui-justify-between ui-px-4 ui-w-full ui-h-16 ui-bg-black ui-rounded-lg"
          >
            <p className="ui-text-white ui-text-base ui-font-normal ui-font-akkuratLL ui-leading-normal">
              {truncateAddress(xionAddress)}
            </p>
            {copied ? <CheckIcon color="white" /> : <CopyIcon color="white" />}
          </div>
          <Button
            className="ui-mt-6"
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
