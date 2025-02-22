import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "../../utils/classname-util";
import { CloseIcon } from "./icons/Close";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  className?: string;
  overApp?: boolean;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, overApp, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        // Base positioning
        "ui-fixed ui-inset-0 ui-z-20",
        // Animations
        "data-[state=open]:ui-animate-in data-[state=closed]:ui-animate-out",
        "data-[state=closed]:ui-fade-out-0 data-[state=open]:ui-fade-in-0",
        className,
      )}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          // Positioning and dimensions
          "ui-absolute ui-inset-0 ui-w-screen ui-h-screen ui-z-20",
          // Visual styling
          "ui-bg-[#181818]/90 ui-backdrop-blur-sm",
        )}
      />
      {!overApp && (
        <>
          {/* Bottom decorative blur */}
          <div
            className={cn(
              // Positioning
              "ui-absolute ui-right-1/2 ui-bottom-[10%] ui-translate-x-1/2 ui-z-30",
              // Dimensions
              "ui-w-[884px] ui-h-[306px]",
              // Visual styling
              "ui-bg-white/[0.03] ui-rounded-[90px]",
              "ui-filter ui-blur-[75px] -ui-rotate-[17.4deg]",
            )}
          />

          {/* Top decorative blur */}
          <div
            className={cn(
              // Positioning
              "ui-absolute ui-right-1/2 ui-top-[20%] ui-translate-x-1/2 ui-z-30",
              // Dimensions
              "ui-w-[484px] ui-h-[106px]",
              // Visual styling
              "ui-bg-white/[0.03] ui-rounded-[90px]",
              "ui-filter ui-blur-[75px] ui-rotate-[17.4deg]",
            )}
          />
        </>
      )}

      <div
        className={cn(
          // Positioning and dimensions
          "ui-absolute ui-inset-0 ui-w-screen ui-h-screen ui-z-50",
          // Visual styling
          "ui-bg-modal-static-2 ui-bg-center ui-bg-fixed ui-opacity-[50%]",
        )}
      />
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  className?: string;
  overApp?: boolean;
  closeButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, overApp, closeButton = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay overApp={overApp} />
    <DialogPrimitive.Content
      aria-describedby={undefined}
      ref={ref}
      className={cn(
        // Positioning and z-index
        "ui-fixed ui-z-50",
        "ui-left-[50%] ui-top-[50%] ui-translate-x-[-50%] ui-translate-y-[-50%]",
        // Dimensions and layout
        "ui-w-full ui-h-screen sm:ui-max-w-lg sm:ui-h-auto md:ui-min-w-[560px]",
        // Padding and layout
        "ui-p-10 ui-gap-12 !ui-flex ui-flex-col ui-justify-center sm:ui-p-12 sm:ui-block sm:ui-flex-none",
        // Visual styling
        "ui-bg-[#0A0A0A]/50 sm:ui-backdrop-blur-2xl sm:ui-rounded-[48px] ui-overflow-y-auto ui-shadow-[0_0_20px_10px_rgba(255,255,255,0.01)]",

        "ui-duration-200",
        // Close animation
        "data-[state=closed]:ui-animate-out data-[state=closed]:ui-fade-out-0 data-[state=closed]:ui-zoom-out-95",
        // Open animation
        "data-[state=open]:ui-animate-in data-[state=open]:ui-fade-in-0 data-[state=open]:ui-zoom-in-95",
        // Slide animations
        "data-[state=closed]:ui-slide-out-to-left-1/2 data-[state=closed]:ui-slide-out-to-top-[48%]",
        "data-[state=open]:ui-slide-in-from-left-1/2 data-[state=open]:ui-slide-in-from-top-[48%]",

        // Additional classes
        className,
      )}
      {...props}
    >
      <VisuallyHidden.Root>
        <DialogPrimitive.Title />
      </VisuallyHidden.Root>
      {closeButton && (
        <DialogClose className="ui-absolute ui-top-6 ui-right-6">
          <CloseIcon strokeWidth={2} className="ui-w-4 ui-h-4" />
        </DialogClose>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ui-flex ui-flex-col ui-text-center ui-gap-2 ui-w-full",
        className,
      )}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader";

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ui-flex ui-flex-col ui-gap-3 ui-items-stretch ui-w-full",
        className,
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

interface DialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  className?: string;
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn(
      "ui-text-[32px] ui-leading-[38px] ui-font-bold ui-tracking-tight",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  className?: string;
}

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn(
      "ui-text-secondary-text ui-text-sm ui-max-w-[340px] ui-mx-auto",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
