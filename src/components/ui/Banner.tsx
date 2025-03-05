import React, { useState, useEffect, useContext } from "react";
import { BaseButton } from "./buttons/baseButton";
import { CloseIcon } from "./icons";
import { AbstraxionContext } from "../AbstraxionContext";

interface BannerProps {
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { chainInfo } = useContext(AbstraxionContext);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem("banner_dismissed");
    if (bannerDismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem("banner_dismissed", "true");
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("https://github.com/orgs/burnt-labs/discussions/1", "_blank", "noopener,noreferrer");
  };

  const currentChainId = chainInfo?.chainId || "";
  const shouldShowBanner = currentChainId === "xion-testnet-2";

  if (!isVisible || !shouldShowBanner) {
    return null;
  }

  return (
    <div
      className={`ui-w-full ui-px-4 ui-py-3 ui-bg-testnet-bg ui-pointer-events-auto ${className}`}
    >
      <div className="ui-max-w-7xl ui-mx-auto ui-flex ui-items-center ui-justify-between">
        <div className="ui-flex-1 ui-text-testnet">
          <div className="ui-flex ui-flex-wrap ui-items-center ui-gap-x-2">
            <span className="ui-font-akkuratLL">
              We are migrating to testnet-2 soon!{" "}
              <BaseButton
                variant="text"
                size="text"
                onClick={handleLinkClick}
                className="ui-underline ui-text-testnet ui-text-base !ui-inline"
              >
                Learn more
              </BaseButton>
            </span>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="ui-p-1 ui-rounded-full ui-text-white hover:ui-bg-white/10 ui-transition-colors ui-cursor-pointer ui-ml-3"
          aria-label="Dismiss"
        >
          <CloseIcon className="ui-h-4 ui-w-4 ui-text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default Banner;
