import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
        "ui-fixed ui-inset-0 ui-z-30",
        // Animations
        "ui-transition-opacity ui-duration-200",
        "data-[state=closed]:ui-opacity-0 data-[state=open]:ui-opacity-100",
        className,
      )}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          // Positioning and dimensions
          "ui-absolute ui-inset-0 ui-w-screen ui-h-screen ui-z-30",
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
              "ui-absolute ui-right-1/2 ui-bottom-[10%] ui-translate-x-1/2 ui-z-40",
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
              "ui-absolute ui-right-1/2 ui-top-[20%] ui-translate-x-1/2 ui-z-40",
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

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    { className, children, overApp, closeButton = false, ...props },
    forwardedRef,
  ) => {
    const [isTall, setIsTall] = React.useState(false);

    const stateRef = React.useRef({
      element: null as HTMLDivElement | null,
      observers: null as {
        resize?: ResizeObserver;
        attributes?: MutationObserver;
      } | null,
      timeouts: [] as number[],
      lastCheckTime: 0,
      isObserving: false,
      previousWindowHeight: window.innerHeight,
      previousWindowWidth: window.innerWidth,
      naturalContentHeight: 0,
      widthMeasurementTimeout: null as number | null,
      handleWindowResize: null as (() => void) | null,
    });

    React.useEffect(() => {
      const element = stateRef.current.element;
      if (element) {
        const dataState = element.getAttribute("data-state");
        if (dataState === "closed") {
          setIsTall(false);
        }
      }
    }, [stateRef.current.element]);

    const measureNaturalContentSize = React.useCallback(() => {
      const { element } = stateRef.current;
      if (!element) return { width: 0, height: 0 };

      const originalStyles = {
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        maxWidth: element.style.maxWidth,
        width: element.style.width,
        maxHeight: element.style.maxHeight,
        height: element.style.height,
        transform: element.style.transform,
        overflow: element.style.overflow,
        display: element.style.display,
      };

      element.style.position = "absolute";
      element.style.top = "-9999px";
      element.style.left = "-9999px";
      element.style.maxWidth = "min(560px, 100vw - 32px)";
      element.style.width = "auto";
      element.style.maxHeight = "";
      element.style.height = "auto";
      element.style.transform = "none";
      element.style.overflow = "visible";
      element.style.display = "block";

      const naturalWidth = element.offsetWidth;
      const naturalHeight = element.scrollHeight;

      stateRef.current.naturalContentHeight = naturalHeight;

      element.style.position = originalStyles.position;
      element.style.top = originalStyles.top;
      element.style.left = originalStyles.left;
      element.style.maxWidth = originalStyles.maxWidth;
      element.style.width = originalStyles.width;
      element.style.maxHeight = originalStyles.maxHeight;
      element.style.height = originalStyles.height;
      element.style.transform = originalStyles.transform;
      element.style.overflow = originalStyles.overflow;
      element.style.display = originalStyles.display;

      return { width: naturalWidth, height: naturalHeight };
    }, []);

    const checkHeight = React.useCallback(
      (forceUpdate = false) => {
        const { element } = stateRef.current;
        if (!element) return;

        const now = Date.now();
        if (!forceUpdate && now - stateRef.current.lastCheckTime < 100) return;
        stateRef.current.lastCheckTime = now;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const previousWidth = stateRef.current.previousWindowWidth;
        const previousHeight = stateRef.current.previousWindowHeight;

        stateRef.current.previousWindowWidth = windowWidth;
        stateRef.current.previousWindowHeight = windowHeight;

        const isSignificantWidthChange =
          Math.abs(windowWidth - previousWidth) > 10;

        if (isSignificantWidthChange || forceUpdate) {
          if (stateRef.current.widthMeasurementTimeout) {
            clearTimeout(stateRef.current.widthMeasurementTimeout);
          }

          stateRef.current.widthMeasurementTimeout = window.setTimeout(() => {
            const { height: naturalHeight } = measureNaturalContentSize();

            const minHeightThreshold = 200;
            const shouldBeTall =
              naturalHeight > windowHeight * 0.85 &&
              naturalHeight > minHeightThreshold;

            if (shouldBeTall !== isTall) {
              setIsTall(shouldBeTall);
            }
          }, 100) as unknown as number;

          return;
        }

        if (isTall && windowHeight > previousHeight) {
          const { height: naturalHeight } = measureNaturalContentSize();

          if (naturalHeight <= windowHeight * 0.85) {
            setIsTall(false);
          }
          return;
        }

        const contentHeight = element.scrollHeight;
        const minHeightThreshold = 200;
        const shouldBeTall =
          contentHeight > windowHeight * 0.85 &&
          contentHeight > minHeightThreshold;

        if (shouldBeTall !== isTall) {
          setIsTall(shouldBeTall);
        }
      },
      [isTall, measureNaturalContentSize],
    );

    const checkHeightRef = React.useRef(checkHeight);

    React.useEffect(() => {
      checkHeightRef.current = checkHeight;
    }, [checkHeight]);

    const cleanupObservers = React.useCallback(() => {
      stateRef.current.timeouts.forEach((id) => {
        window.clearTimeout(id);
      });
      stateRef.current.timeouts = [];

      if (stateRef.current.widthMeasurementTimeout) {
        clearTimeout(stateRef.current.widthMeasurementTimeout);
        stateRef.current.widthMeasurementTimeout = null;
      }

      if (stateRef.current.observers) {
        if (stateRef.current.observers.resize) {
          stateRef.current.observers.resize.disconnect();
        }
        if (stateRef.current.observers.attributes) {
          stateRef.current.observers.attributes.disconnect();
        }
        stateRef.current.observers = null;
      }

      stateRef.current.isObserving = false;

      if (stateRef.current.handleWindowResize) {
        window.removeEventListener(
          "resize",
          stateRef.current.handleWindowResize,
        );
        stateRef.current.handleWindowResize = null;
      }
    }, []);

    const setupObservers = React.useCallback(() => {
      cleanupObservers();

      const element = stateRef.current.element;
      if (!element) return;

      stateRef.current.observers = {};

      const scheduleCheck = (delay: number) => {
        if (stateRef.current.timeouts.length > 0) {
          stateRef.current.timeouts.forEach((id) => window.clearTimeout(id));
          stateRef.current.timeouts = [];
        }
        const id = window.setTimeout(() => {
          measureNaturalContentSize();
          checkHeightRef.current(true);
          stateRef.current.timeouts = stateRef.current.timeouts.filter(
            (t) => t !== id,
          );
        }, delay);
        stateRef.current.timeouts.push(id);
      };

      scheduleCheck(150);

      const attributeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-state"
          ) {
            if (element.getAttribute("data-state") === "open") {
              scheduleCheck(150);
            }
          }
        }
      });
      attributeObserver.observe(element, { attributes: true });
      stateRef.current.observers.attributes = attributeObserver;

      let resizeTimeout: number | null = null;
      const resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout) window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          checkHeightRef.current(true);
        }, 100) as unknown as number;
      });

      const handleWindowResize = () => {
        if (!element || !document.body.contains(element)) return;
        scheduleCheck(100);
      };
      stateRef.current.handleWindowResize = handleWindowResize;
      window.addEventListener("resize", handleWindowResize);

      const startObserving = window.setTimeout(() => {
        if (element && document.body.contains(element)) {
          resizeObserver.observe(element);
          stateRef.current.isObserving = true;
        }
      }, 300);
      stateRef.current.timeouts.push(startObserving);
      stateRef.current.observers.resize = resizeObserver;

      return () => {
        cleanupObservers();
      };
    }, [measureNaturalContentSize, cleanupObservers]);

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        stateRef.current.element = node;

        cleanupObservers();

        if (node) {
          setTimeout(() => {
            if (stateRef.current.element === node) {
              setupObservers();
            }
          }, 0);
        }

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [setupObservers, cleanupObservers, forwardedRef],
    );

    React.useEffect(() => {
      return cleanupObservers;
    }, [cleanupObservers]);

    return (
      <DialogPortal>
        <DialogOverlay overApp={overApp} />
        <DialogPrimitive.Content
          role="dialog"
          aria-modal="true"
          ref={handleRef}
          className={cn(
            "ui-fixed ui-z-50",
            !isTall
              ? "ui-left-0 ui-top-0 sm:ui-left-[50%] sm:ui-top-[50%] sm:-ui-translate-x-1/2 sm:-ui-translate-y-1/2"
              : "ui-left-0 ui-top-0 sm:ui-left-[50%] sm:-ui-translate-x-1/2",
            !isTall && "ui-w-full sm:ui-max-w-lg md:ui-min-w-[560px]",
            isTall && "ui-max-w-full ui-w-full",
            "ui-p-10 ui-gap-12 !ui-flex ui-flex-col sm:ui-p-12 sm:ui-block sm:ui-flex-none",
            !isTall && "ui-justify-center",
            "ui-bg-[#0A0A0A]/50 ui-backdrop-blur-2xl ui-rounded-none sm:ui-rounded-[48px] ui-shadow-[0_0_20px_10px_rgba(255,255,255,0.01)]",
            isTall && "!ui-rounded-none",
            !isTall
              ? "ui-h-screen ui-max-h-screen sm:ui-max-h-[90vh] sm:ui-h-auto"
              : "ui-max-h-screen ui-h-full ui-overflow-y-auto",
            "ui-transition-all ui-duration-200",
            "data-[state=closed]:ui-opacity-0",
            "data-[state=open]:ui-opacity-100",
            className,
          )}
          {...props}
        >
          {closeButton && (
            <DialogClose
              className="ui-absolute ui-top-6 ui-right-6"
              aria-label="Close dialog"
            >
              <CloseIcon strokeWidth={2} className="ui-w-4 ui-h-4" />
            </DialogClose>
          )}
          <div
            className={cn(
              "ui-flex ui-flex-col ui-gap-8",
              isTall && "ui-w-full ui-max-w-[464px] ui-mx-auto",
              !isTall && "ui-overflow-y-auto ui-max-h-full",
            )}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
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
