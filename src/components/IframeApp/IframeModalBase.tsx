import { ReactNode } from 'react';
import { DialogHeader, DialogDescription, DialogFooter } from '../ui/dialog';
import xionLogo from '../../assets/logo.png';
import { NETWORK } from '../../config';

interface IframeModalBaseProps {
  /** Main title shown at the top */
  title?: ReactNode;
  /** Description text shown below the title */
  description?: ReactNode;
  /** Main content of the modal */
  children: ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Whether to show the disclaimer at the bottom */
  showDisclaimer?: boolean;
  /** Whether to show the XION logo with mainnet/testnet banner */
  showLogo?: boolean;
}

/**
 * Base modal component for all iframe modals
 * Provides consistent styling with XION logo, mainnet/testnet banner, and disclaimer
 */
export function IframeModalBase({
  title,
  description,
  children,
  footer,
  showDisclaimer = true,
  showLogo = true,
}: IframeModalBaseProps) {

  return (
    <>
      {showLogo && (
        <DialogHeader>
          <div className="ui-flex ui-flex-col ui-items-center ui-gap-2 ui-w-full">
            <div className="ui-flex ui-items-center ui-space-x-3">
              <img
                src={xionLogo}
                alt="XION Logo"
                width="108"
                height="39"
                className="ui-mb-2"
                style={{ filter: 'var(--modal-logo-filter, none)' }}
              />
              <div 
                className="ui-flex ui-justify-between ui-items-center ui-h-[18px] ui-bg-testnet-bg ui-px-1 ui-py-0 ui-mb-2 ui-text-testnet ui-rounded-[4px] ui-text-[10px] ui-tracking-widest"
                style={{ 
                  backgroundColor: 'var(--modal-badge-bg, rgb(255, 74, 74, 0.1))',
                  color: 'var(--modal-badge-text, #FF4A4A)'
                }}
              >
                {NETWORK.toUpperCase()}
              </div>
            </div>
            {description && (
              <DialogDescription style={{ color: 'var(--modal-secondary-text-color, inherit)' }}>
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
      )}

      {!showLogo && title && (
        <DialogHeader>
          {typeof title === 'string' ? (
            <h2 className="ui-text-xl ui-font-bold" style={{ color: 'var(--modal-text-color, inherit)' }}>
              {title}
            </h2>
          ) : (
            title
          )}
          {description && typeof description === 'string' ? (
            <DialogDescription style={{ color: 'var(--modal-secondary-text-color, inherit)' }}>
              {description}
            </DialogDescription>
          ) : (
            description
          )}
        </DialogHeader>
      )}

      <div className="ui-flex-1" style={{ fontFamily: 'var(--modal-font-family, inherit)' }}>
        {children}
      </div>

      {footer && (
        <DialogFooter>
          {footer}
        </DialogFooter>
      )}

      {showDisclaimer && (
        <div className="ui-text-xs ui-font-normal ui-leading-5 ui-text-center ui-max-w-[340px] ui-mx-auto ui-mt-4">
          <span className="ui-text-secondary-text" style={{ color: 'var(--modal-secondary-text-color, inherit)' }}>
            By continuing, you agree to and acknowledge that you have read and understand the{' '}
          </span>
          <a 
            href="https://burnt.com/terms-and-conditions" 
            target="_blank" 
            rel="noreferrer" 
            className="ui-text-white ui-underline ui-font-bold"
            style={{ color: 'var(--modal-primary-color, white)' }}
          >
            Disclaimer
          </a>
          <span className="ui-text-secondary-text" style={{ color: 'var(--modal-secondary-text-color, inherit)' }}>
            .
          </span>
        </div>
      )}
    </>
  );
}
