import React from "react";
import { cn } from "../../../utils/classname-util";

export const CloseIcon = ({
  onClick,
  className,
}: {
  onClick?: VoidFunction;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("ui-h-6 ui-w-6", className)}
    onClick={onClick}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
