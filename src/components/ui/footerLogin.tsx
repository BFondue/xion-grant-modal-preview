import xionLogo from "../../assets/logo.png";
import { isMainnet, NETWORK } from "../../config";


const FooterLogin = () => {
  return (
    <div className="ui-self-end ui-pointer-events-auto ui-w-full ui-z-[30] ui-flex ui-flex-col ui-gap-2 sm:ui-gap-12 ui-pb-safe ui-items-center sm:ui-flex-row sm:ui-justify-between sm:ui-items-end">
      <div className="ui-text-xs ui-font-normal ui-leading-5 ui-text-center sm:ui-text-left ui-max-w-[280px] sm:ui-max-w-full">
        <span className="ui-text-secondary-text">
          By continuing, you agree to and acknowledge that you have read and
          understand the
        </span>
        <a
          href="https://burnt.com/terms-and-conditions"
          className="ui-pl-1 ui-text-white ui-underline ui-font-bold"
        >
          Disclaimer
        </a>
        <span className="ui-text-secondary-text">.</span>
      </div>
      <div className="ui-flex ui-gap-3 ui-justify-center ui-items-end sm:ui-my-0">
        <p className="ui-text-xs sm:ui-text-sm ui-text-secondary-text ui-mb-0.5 sm:ui-mb-1.5 ui-text-nowrap">
          Powered by
        </p>
        <div className="ui-flex ui-flex-row-reverse ui-items-center sm:ui-items-start sm:ui-flex-col">
          <div
            className={`ui-flex ui-justify-between ui-items-center ui-h-[18px] ${
              isMainnet() ? "ui-bg-mainnet-bg" : "ui-bg-testnet-bg"
            } ui-px-1 ui-py-0 ui-ml-2 ui-mt-1.5 sm:ui-ml-0 sm:ui-mb-2 ${
              isMainnet() ? "ui-text-mainnet" : "ui-text-testnet"
            } ui-rounded-[4px] ui-text-[10px] ui-tracking-widest`}
          >
            {NETWORK.toUpperCase()}
          </div>
          <a
            href="https://burnt.com/terms-and-conditions"
            className="ui-w-[70px] ui-h-[24px] sm:ui-w-[108px] sm:ui-h-[39px]"
          >
            <img src={xionLogo} alt="XION Logo" width="108" height="39" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default FooterLogin;
