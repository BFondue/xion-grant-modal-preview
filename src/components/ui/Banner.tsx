import React, { useState, useEffect } from "react";
import { BaseButton } from "./buttons/baseButton";
import { CloseIcon } from "./icons";

interface BannerProps {
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [bannerConfig, setBannerConfig] = useState({
    enabled: false,
    message: "",
    link: "",
    linkText: "",
    backgroundColor: "",
    textColor: "",
    networks: [] as string[],
  });

  useEffect(() => {
    const enabled = import.meta.env.VITE_BANNER_ENABLED === "true";
    const message = import.meta.env.VITE_BANNER_MESSAGE || "";
    const link = import.meta.env.VITE_BANNER_LINK || "";
    const linkText = import.meta.env.VITE_BANNER_LINK_TEXT || "Learn more";

    const backgroundColor =
      import.meta.env.VITE_BANNER_BG_COLOR || "ui-bg-testnet-bg";
    const textColor =
      import.meta.env.VITE_BANNER_TEXT_COLOR || "ui-text-testnet";

    // Get networks where the banner should be displayed
    const networksString =
      import.meta.env.VITE_BANNER_NETWORKS || "xion-testnet-2";
    const networks = networksString.split(",").map((network) => network.trim());

    setBannerConfig({
      enabled,
      message,
      link,
      linkText,
      backgroundColor,
      textColor,
      networks,
    });

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
    if (bannerConfig.link) {
      window.open(bannerConfig.link, "_blank", "noopener,noreferrer");
    }
  };

  const currentChainId =
    typeof import.meta.env.VITE_DEFAULT_CHAIN_INFO === "string"
      ? JSON.parse(import.meta.env.VITE_DEFAULT_CHAIN_INFO)?.chainId
      : "";

  const shouldDisplayOnCurrentNetwork =
    bannerConfig.networks.includes(currentChainId);

  if (!bannerConfig.enabled || !isVisible || !shouldDisplayOnCurrentNetwork) {
    return null;
  }

  return (
    <div
      className={`ui-w-full ui-px-4 ui-py-3 ${bannerConfig.backgroundColor} ui-pointer-events-auto ${className}`}
    >
      <div className="ui-max-w-7xl ui-mx-auto ui-flex ui-items-center ui-justify-between">
        <div className={`ui-flex-1 ${bannerConfig.textColor}`}>
          <div className="ui-flex ui-flex-wrap ui-items-center ui-gap-x-2">
            <span className="ui-font-akkuratLL">
              {bannerConfig.message}{" "}
              {bannerConfig.link && (
                <BaseButton
                  variant="text"
                  size="text"
                  onClick={handleLinkClick}
                  className="ui-underline ui-text-testnet ui-text-base !ui-inline"
                >
                  {bannerConfig.linkText}
                </BaseButton>
              )}
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
