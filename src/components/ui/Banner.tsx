import React, { useState, useEffect } from "react";

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
  });

  useEffect(() => {
    const enabled = import.meta.env.VITE_BANNER_ENABLED === "true";
    const message = import.meta.env.VITE_BANNER_MESSAGE || "";
    const link = import.meta.env.VITE_BANNER_LINK || "";
    const linkText = import.meta.env.VITE_BANNER_LINK_TEXT || "Learn more";
    
    const backgroundColor = import.meta.env.VITE_BANNER_BG_COLOR || "ui-bg-testnet-bg";
    const textColor = import.meta.env.VITE_BANNER_TEXT_COLOR || "ui-text-testnet";

    setBannerConfig({
      enabled,
      message,
      link,
      linkText,
      backgroundColor,
      textColor,
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

  if (!bannerConfig.enabled || !isVisible) {
    return null;
  }

  return (
    <div
      className={`ui-w-full ui-px-4 ui-py-3 ${bannerConfig.backgroundColor} ui-pointer-events-auto ${className}`}
    >
      <div className="ui-max-w-7xl ui-mx-auto ui-flex ui-items-center ui-justify-between">
        <div className={`ui-flex ui-flex-col sm:ui-flex-row ui-items-start sm:ui-items-center ui-gap-2 ${bannerConfig.textColor}`}>
          <span className="ui-font-akkuratLL">{bannerConfig.message}</span>
          {bannerConfig.link && (
            <a
              href={bannerConfig.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-underline ui-font-medium ui-cursor-pointer ui-mt-1 sm:ui-mt-0"
              onClick={(e) => e.stopPropagation()}
            >
              {bannerConfig.linkText}
            </a>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="ui-p-1 ui-rounded-full ui-text-secondary-text hover:ui-bg-black/10 ui-transition-colors ui-cursor-pointer ui-self-start sm:ui-self-center"
          aria-label="Dismiss"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Banner; 