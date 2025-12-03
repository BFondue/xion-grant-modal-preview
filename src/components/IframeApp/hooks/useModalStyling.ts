import { useEffect, useState } from 'react';

interface ModalStyle {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  borderColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  customCSS?: string;
}

/**
 * Custom hook to manage modal styling from parent window messages
 * Handles CSS variable application and custom CSS injection
 */
export function useModalStyling() {
  const [modalStyle, setModalStyle] = useState<ModalStyle | null>(null);

  const applyModalStyling = (style: ModalStyle) => {
    const root = document.documentElement;

    // Apply CSS variables
    if (style.primaryColor) {
      root.style.setProperty('--modal-primary-color', style.primaryColor);
    }
    if (style.backgroundColor) {
      root.style.setProperty('--modal-bg-color', style.backgroundColor);
    }
    if (style.textColor) {
      root.style.setProperty('--modal-text-color', style.textColor);
    }
    if (style.secondaryTextColor) {
      root.style.setProperty('--modal-secondary-text-color', style.secondaryTextColor);
    }
    if (style.borderColor) {
      root.style.setProperty('--modal-border-color', style.borderColor);
    }
    if (style.borderRadius) {
      root.style.setProperty('--modal-border-radius', style.borderRadius);
    }
    if (style.fontFamily) {
      root.style.setProperty('--modal-font-family', style.fontFamily);
    }

    // Inject custom CSS if provided
    if (style.customCSS) {
      let styleEl = document.getElementById('modal-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'modal-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = style.customCSS;
    }
  };

  useEffect(() => {
    const handleStyleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SET_MODAL_STYLE' && event.data.payload) {
        console.log('[useModalStyling] Received modal style config:', event.data.payload);
        setModalStyle(event.data.payload);
        applyModalStyling(event.data.payload);
      }
    };

    window.addEventListener('message', handleStyleMessage);
    return () => window.removeEventListener('message', handleStyleMessage);
  }, []);

  return modalStyle;
}
