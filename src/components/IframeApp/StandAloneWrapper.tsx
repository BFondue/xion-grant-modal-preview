import { useEffect, useRef } from "react";

/**
 * Main App component - wrapper for standalone mode
 * Uses XionSDK to create and manage the iframe
 * The SDK handles modal show/hide and all communication
 */
export function StandAloneWrapper() {
  const sdkInitialized = useRef(false);

  // Listen for disconnect message from SDK iframe
  useEffect(() => {
    const handleDisconnect = (event: MessageEvent) => {
      if (event.data.type === "DISCONNECTED") {
        console.log(
          "[StandaloneWrapper] Received disconnect, refreshing page...",
        );
        window.location.reload();
      }
    };
    window.addEventListener("message", handleDisconnect);
    return () => window.removeEventListener("message", handleDisconnect);
  }, []);

  useEffect(() => {
    // Initialize XionSDK for standalone mode
    const initSDK = async () => {
      if (typeof window === "undefined" || sdkInitialized.current) return;
      sdkInitialized.current = true;

      try {
        // Dynamic import of XionSDK
        const { XionSDK } = await import("@burnt-labs/xion-auth-sdk");

        // Initialize SDK pointing to the iframe route
        // Use alwaysVisible since we want the dashboard to stay visible after login
        const sdk = new XionSDK({
          iframeUrl: window.location.origin + "/iframe",
          alwaysVisible: true,
        });

        // Store SDK instance globally for debugging
        (window as unknown as Record<string, unknown>).__xionSDK = sdk;

        console.log(
          "[StandaloneWrapper] XionSDK initialized, calling connect...",
        );

        // Connect immediately - the SDK will create the iframe and wait for it to be ready
        try {
          const result = await sdk.connect();
          console.log("[StandaloneWrapper] Connected:", result);
        } catch (error) {
          console.log("[StandaloneWrapper] User cancelled or error:", error);
        }
      } catch (error) {
        console.error(
          "[StandaloneWrapper] Failed to initialize XionSDK:",
          error,
        );
      }
    };

    initSDK();
  }, []);

  // The SDK creates its own iframe, so we just need a container
  // The iframe will be appended to document.body by the SDK
  return (
    <div className="ui-w-full ui-h-svh ui-fixed ui-inset-0 ui-bg-background">
      <div className="ui-flex ui-items-center ui-justify-center ui-h-full">
        <div className="ui-text-center ui-p-6">
          <div className="ui-animate-spin ui-w-8 ui-h-8 ui-border-2 ui-border-primary ui-border-t-transparent ui-rounded-full ui-mx-auto ui-mb-4" />
          <p className="ui-text-body ui-text-text-secondary">Initializing...</p>
        </div>
      </div>
    </div>
  );
}
