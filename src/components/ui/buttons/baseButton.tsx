import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/classname-util";
import { ChevronRightIcon } from "../icons/ChevronRight";

const buttonVariants = cva(
  "ui-px-4 ui-py-2 ui-inline-flex ui-items-center ui-justify-center ui-gap-2 ui-whitespace-nowrap ui-rounded-lg ui-text-sm ui-ring-offset-background ui-transition-colors focus-visible:ui-outline-none focus-visible:ui-ring-2 focus-visible:ui-ring-ring focus-visible:ui-ring-offset-2 disabled:ui-opacity-50 disabled:ui-pointer-events-none",
  {
    variants: {
      variant: {
        default: "ui-bg-white ui-text-black hover:ui-bg-white/90",
        secondary: "ui-border ui-border-border hover:ui-bg-white/[0.15]",
        destructive:
          "ui-bg-transparent ui-text-destructive ui-border ui-border-destructive hover:ui-bg-destructive/10",
        text: "ui-text-secondary-text hover:ui-text-white",
      },
      size: {
        default: "ui-h-12",
        large: "ui-h-[52px]",
        small: "ui-h-10 ui-min-w-[100px] ui-w-fit",
        text: "ui-p-1 ui-fit ui-leading-none",
        icon: "ui-h-10 ui-w-10",
        "icon-large": "ui-h-12 ui-w-12 ui-min-w-12 ui-min-h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  backArrow?: boolean;
}

const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  ({ className, variant, size, backArrow, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(buttonVariants({ variant, size, className }), className)}
      >
        {backArrow && (
          <ChevronRightIcon className="ui-rotate-180" color="#000000" />
        )}
        {props.children}
      </button>
    );
  },
);
BaseButton.displayName = "BaseButton";

export { BaseButton, type BaseButtonProps };
