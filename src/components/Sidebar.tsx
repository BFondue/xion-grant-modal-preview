import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AbstraxionContext, AbstraxionContextProps } from "./AbstraxionContext";
import { CloseIcon, WalletIcon } from "./ui";
import { ExternalLinkIcon } from "./ui/icons/ExternalLink";
import { EllipsisButton } from "./ui/buttons/ellipsis-button";
import { NetworkBadge } from "./ui/NetworkBadge";
import { useAbstraxionAccount } from "../hooks";
import { truncateAddress } from "../utils";
import xionLogo from "../assets/logo.png";
import { cn } from "../utils/classname-util";

interface SidebarProps {
  onClose?: VoidFunction;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { isMainnet, setIsOpen, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;
  const { data: account } = useAbstraxionAccount();

  const NAV_OPTIONS = React.useMemo(
    () => [
      { text: "Home", path: "/" },
      {
        text: "History",
        path: isMainnet
          ? "https://www.mintscan.io/xion"
          : chainInfo?.chainId === "xion-testnet-2"
            ? "https://www.mintscan.io/xion-testnet"
            : "https://explorer.burnt.com/xion-testnet-1/",
        external: true,
      },
      {
        text: "Staking",
        path: isMainnet
          ? "https://staking.burnt.com"
          : "https://staking.testnet.burnt.com",
        external: true,
      },
    ],
    [isMainnet, chainInfo?.chainId],
  );

  const renderNavOptions = () => {
    return NAV_OPTIONS.map((option) => {
      if (option.external) {
        return (
          <a
            key={option.text}
            href={option.path}
            target="_blank"
            className={cn(
              "ui-text-[32px] ui-font-bold ui-leading-[120%] ui-text-white/60",
            )}
            rel="noreferrer"
            onClick={onClose}
          >
            <span className="ui-flex ui-items-center ui-gap-3">
              {option.text}
              <ExternalLinkIcon size={24} />
            </span>
          </a>
        );
      }
      return (
        <Link
          key={option.text}
          to={option.path}
          className={cn(
            "ui-text-[32px] ui-leading-[120%] ui-font-bold ui-text-white/60",
            { "ui-text-white": pathname === option.path },
          )}
          onClick={onClose}
        >
          {option.text}
        </Link>
      );
    });
  };

  return (
    <div className="ui-min-h-dvh ui-bg-background ui-flex ui-flex-col ui-w-[320px] ui-px-6">
      {/* Header with Logo and Network */}
      <div className="ui-flex ui-items-center ui-justify-between ui-py-4">
        <div className="ui-flex ui-items-center ui-space-x-2">
          <img
            src={xionLogo}
            alt="XION Logo"
            width="90"
            height="32"
            className="ui-mb-1.5"
          />
          <NetworkBadge isMainnet={isMainnet} />
        </div>
        {onClose && (
          <button onClick={onClose} className="ui-text-white">
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="ui-flex ui-flex-col ui-justify-center ui-flex-1 ui-gap-8">
        {renderNavOptions()}
      </div>

      <div className="ui-py-6">
        <div className="ui-flex ui-items-center ui-justify-between">
          <div className="ui-flex ui-items-center ui-space-x-3">
            <WalletIcon
              color="white"
              backgroundColor="hsla(var(--background), 1)"
            />
            <span className="ui-text-lg ui-font-bold">
              {account?.id && truncateAddress(account.id)}
            </span>
          </div>
          <EllipsisButton onClick={() => setIsOpen(true)} />
        </div>
      </div>
    </div>
  );
}
