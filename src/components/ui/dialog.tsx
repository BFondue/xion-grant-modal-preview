import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "../../utils/classname-util";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  className?: string;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "ui-fixed ui-inset-0 ui-z-50 ui-backdrop-blur-lg ui-bg-black/80 ui-data-[state=open]:ui-animate-in ui-data-[state=closed]:ui-animate-out ui-data-[state=closed]:ui-fade-out-0 ui-data-[state=open]:ui-fade-in-0",
      className,
    )}
    ref={ref}
    {...props}
  >
    <div className="ui-absolute ui-h-screen ui-w-screen ui-inset-0 ui-bg-modal-static ui-opacity-60 ui-bg-center ui-bg-fixed ui-z-50" />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  className?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <div className="ui-absolute ui-h-screen ui-w-screen ui-inset-0 ui-bg-modal-overlay ui-backdrop-blur-3xl ui-opacity-40 ui-bg-no-repeat ui-bg-cover ui-bg-center ui-bg-fixed ui-z-50" />
    <DialogPrimitive.Content
      aria-describedby={undefined}
      className={cn(
        "ui-z-50 md:ui-min-w-[560px] ui-fixed ui-grid ui-w-full sm:ui-max-w-lg ui-gap-4 ui-p-10 sm:ui-p-12 ui-overflow-y-auto ui-duration-200 sm:ui-rounded-[48px] ui-left-[50%] ui-top-[50%] ui-bg-black/50 !ui-flex ui-justify-center ui-flex-col sm:ui-block sm:ui-flex-none ui-h-screen sm:ui-h-auto sm:ui-backdrop-blur-2xl ui-data-[state=open]:ui-animate-in ui-data-[state=closed]:ui-animate-out ui-data-[state=closed]:ui-fade-out-0 ui-data-[state=open]:ui-fade-in-0 ui-data-[state=closed]:ui-zoom-out-95 ui-data-[state=open]:ui-zoom-in-95 ui-data-[state=closed]:ui-slide-out-to-left-1/2 ui-data-[state=closed]:ui-slide-out-to-top-[48%] ui-data-[state=open]:ui-slide-in-from-left-1/2 ui-data-[state=open]:ui-slide-in-from-top-[48%] ui-translate-x-[-50%] ui-translate-y-[-50%]",
        className,
      )}
      ref={ref}
      {...props}
    >
      <VisuallyHidden.Root>
        <DialogPrimitive.Title />
      </VisuallyHidden.Root>
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
        "ui-flex ui-flex-col ui-space-y-1.5 ui-text-center sm:ui-text-left",
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
        "ui-flex ui-flex-col-reverse sm:ui-flex-row sm:ui-justify-end sm:ui-space-x-2",
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
      "ui-text-lg ui-font-semibold ui-leading-none ui-tracking-tight",
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
    className={cn("ui-text-neutral-500 ui-text-sm", className)}
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
