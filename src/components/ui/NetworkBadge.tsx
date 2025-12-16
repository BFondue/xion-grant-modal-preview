import { NETWORK } from "../../config";
import { cn } from "../../utils/classname-util";

interface NetworkBadgeProps {
  isMainnet: boolean;
}

export function NetworkBadge({ isMainnet }: NetworkBadgeProps) {
  return (
    <div
      className={cn(
        "ui-flex ui-items-center ui-justify-center ui-px-1 ui-py-0.5 ui-rounded-[4px] ui-text-[10px] ui-leading-[12px] ui-tracking-widest",
        {
          "ui-bg-mainnet-bg ui-text-mainnet": isMainnet,
          "ui-bg-testnet-bg ui-text-testnet": !isMainnet,
        },
      )}
    >
      {NETWORK.toUpperCase()}
    </div>
  );
}
