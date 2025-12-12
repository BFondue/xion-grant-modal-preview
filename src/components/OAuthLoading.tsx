/**
 * Loading spinner page shown during OAuth redirect
 */
export function OAuthLoading() {
  return (
    <div className="ui-fixed ui-inset-0 ui-z-[1000] ui-flex ui-items-center ui-justify-center ui-gap-6 ui-rounded-none sm:ui-rounded-[48px] ui-shadow-[0_0_20px_10px_rgba(255,255,255,0.01)] ui-p-12 ui-w-full sm:ui-max-w-lg md:ui-min-w-[560px] ui-bg-[#0A0A0A]">
      <div className="ui-flex ui-flex-col ui-items-center ui-gap-6">
        {/* Spinner */}
        <div className="ui-relative ui-w-16 ui-h-16">
          <div className="ui-absolute ui-inset-0 ui-border-4 ui-border-white/20 ui-rounded-full"></div>
          <div className="ui-absolute ui-inset-0 ui-border-4 ui-border-transparent ui-border-t-white ui-rounded-full ui-animate-spin"></div>
        </div>

        {/* Loading text */}
        <div className="ui-flex ui-flex-col ui-items-center ui-gap-2">
          <p className="ui-text-white ui-text-lg ui-font-medium">Loading...</p>
          <p className="ui-text-white/60 ui-text-sm">Please wait</p>
        </div>
      </div>
    </div>
  );
}
