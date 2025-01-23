import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AbstraxionContext, AbstraxionContextProps } from "./AbstraxionContext";
import { CloseIcon, WalletIcon } from "./ui";

import xionLogo from "../assets/logo.png";

interface SidebarProps {
  onClose?: VoidFunction;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { isMainnet, setIsOpen } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const NAV_OPTIONS = React.useMemo(
    () => [
      { text: "home", path: "/" },
      {
        text: "history",
        path: isMainnet
          ? "https://www.mintscan.io/xion"
          : "https://explorer.burnt.com/xion-testnet-1/",
        external: true,
      },
      {
        text: "staking",
        path: isMainnet
          ? "https://staking.burnt.com"
          : "https://staking.testnet.burnt.com",
        external: true,
      },
    ],
    [isMainnet],
  );

  const renderNavOptions = () => {
    return NAV_OPTIONS.map((option) => {
      if (option.external) {
        return (
          <a
            key={option.text}
            href={option.path}
            target="_blank"
            className={`ui-text-neutral-500 ui-block ui-uppercase ui-tracking-[-0.32px] ui-text-[32px] ui-leading-[38px] ui-font-light ui-px-8`}
            rel="noreferrer"
          >
            <p>{option.text}</p>
          </a>
        );
      } else {
        return (
          <div
            key={option.text}
            className="ui-flex ui-w-full ui-justify-between ui-px-8 ui-items-center"
          >
            <Link
              to={option.path}
              className={`${
                pathname === option.path
                  ? "ui-text-white"
                  : "ui-text-neutral-500"
              } ui-block ui-uppercase ui-tracking-[-0.32px] ui-text-[32px] ui-leading-[38px] ui-font-light`}
            >
              {option.text}
            </Link>
            <div
              className={`ui-h-3 ui-w-3 ${
                isMainnet ? "ui-bg-mainnet" : "ui-bg-testnet"
              } ui-rounded-full`}
            ></div>
          </div>
        );
      }
    });
  };

  return (
    <div className="ui-min-h-dvh ui-bg-primary ui-border-[#6C6A6A] ui-border-r-[1px] ui-text-white ui-flex ui-flex-col ui-w-64">
      <div className="ui-flex ui-items-center ui-justify-between ui-px-8 ui-pt-8">
        <img src={xionLogo} alt="XION Logo" width="90" height="32" />
        {!onClose ? (
          <div
            className={`ui-flex ui-items-center ui-justify-center ${
              isMainnet ? "ui-bg-mainnet-bg" : "ui-bg-testnet-bg"
            } ui-h-4 ui-px-1 ui-ml-6 ${
              isMainnet ? "ui-text-mainnet" : "ui-text-testnet"
            } ui-rounded-[4px] ui-text-[10px] ui-tracking-[0.8px] ui-leading-3`}
          >
            {isMainnet ? "MAINNET" : "TESTNET"}
          </div>
        ) : (
          <CloseIcon onClick={onClose} className="ui-cursor-pointer" />
        )}
      </div>

      <div className="ui-flex ui-justify-center ui-flex-col ui-gap-7 ui-flex-grow ">
        {renderNavOptions()}
      </div>
      <div className="ui-flex ui-justify-between ui-px-4 ui-h-12 ui-w-full ui-items-center ui-rounded ui-bg-black ui-mx-auto ui-my-2">
        <div className="ui-flex ui-items-center">
          <div className="ui-flex ui-mr-1 ui-h-8 ui-w-8 ui-items-center ui-justify-center ui-rounded-full ui-bg-black">
            <WalletIcon color="white" backgroundColor="black" />
          </div>
          <p className="ui-text-white ui-font-medium">Personal Account</p>
        </div>

        <div
          onClick={() => setIsOpen(true)}
          className="ui-flex ui-items-center ui-ml-2 ui-justify-center ui-border-[#6C6A6A] ui-border-[1px] ui-rounded-full ui-h-10 ui-w-10 ui-cursor-pointer"
        >
          <div className="ui-flex ui-flex-col">
            <div className="ui-h-1 ui-w-1 ui-bg-[#6C6A6A] ui-rounded-full ui-mb-0.5" />
            <div className="ui-h-1 ui-w-1 ui-bg-[#6C6A6A] ui-rounded-full ui-mb-0.5" />
            <div className="ui-h-1 ui-w-1 ui-bg-[#6C6A6A] ui-rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
