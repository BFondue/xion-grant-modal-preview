import React, { useState } from "react";
import { truncateAddress } from "../utils";
import { CheckIcon, CopyIcon } from "./ui";

export function CopyAddress({ xionAddress }: { xionAddress: string }) {
  const [copied, setCopied] = useState(false);

  const copyXionAddress = () => {
    if (xionAddress) {
      navigator.clipboard.writeText(xionAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={copyXionAddress}
      className="ui-flex ui-cursor-pointer ui-items-center ui-justify-between ui-px-4 ui-w-full ui-h-16 ui-bg-black ui-rounded-lg"
    >
      <p className="ui-text-white ui-text-base ui-font-normal ui-leading-normal">
        {truncateAddress(xionAddress)}
      </p>
      {copied ? <CheckIcon color="white" /> : <CopyIcon color="white" />}
    </div>
  );
}
