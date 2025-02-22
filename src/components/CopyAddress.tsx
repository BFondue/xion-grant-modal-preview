import React, { useState } from "react";
import { truncateAddress } from "../utils";
import { CheckIcon, CopyIcon } from "./ui";
import { cn } from "../utils/classname-util";

export function CopyAddress({
  xionAddress,
  fullAddress = false,
  className,
  iconHeight = 10,
  iconWidth = 8,
}: {
  xionAddress: string;
  fullAddress?: boolean;
  className?: string;
  iconHeight?: number;
  iconWidth?: number;
}) {
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
      className={cn(
        "ui-inline-flex ui-h-fit ui-cursor-pointer ui-items-center ui-gap-1 ui-px-[6px] ui-py-[3px] ui-bg-white/10 ui-rounded-[4px] hover:ui-bg-white/15 ui-transition-colors",
        "ui-text-xs ui-font-bold ui-leading-[14px]",
        className,
      )}
    >
      <p className="ui-text-white/80">
        {fullAddress ? xionAddress : truncateAddress(xionAddress)}
      </p>
      {copied ? (
        <CheckIcon color="white" />
      ) : (
        <CopyIcon
          color="rgba(255, 255, 255, 0.7)"
          height={iconHeight}
          width={iconWidth}
        />
      )}
    </div>
  );
}
