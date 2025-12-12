import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type {
  SignTransactionPayload,
  AddAuthenticatorPayload,
} from "../../../messaging/types";

export type ModalType =
  | "auth"
  | "signing"
  | "addAuth"
  | "removeAuth"
  | "grant"
  | null;

interface ModalState {
  type: ModalType;
  payload?: any;
  resolver?: (value: any) => void;
}

/**
 * Custom hook to manage all iframe modals with consolidated state
 * Reduces complexity by managing all modals through a single state object
 */
export function useIframeModals() {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    payload: undefined,
    resolver: undefined,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use ref to track the current resolver to avoid stale closure issues
  const resolverRef = useRef<((value: any) => void) | undefined>(undefined);

  // Keep ref in sync with state
  useEffect(() => {
    resolverRef.current = modalState.resolver;
  }, [modalState.resolver]);

  // Generic modal open function
  const openModal = useCallback(
    (type: ModalType, payload?: any, resolver?: (value: any) => void) => {
      setModalState({
        type,
        payload,
        resolver,
      });
    },
    [],
  );

  const isTransitioningRef = useRef(false);

  // Generic modal close function - uses ref to avoid dependency on modalState
  const closeModal = useCallback((resolveValue?: any) => {
    const resolver = resolverRef.current;

    // Call resolver first - this might trigger the next modal opening
    if (resolver && resolveValue !== undefined) {
      resolver(resolveValue);
    }

    // If we are transitioning, don't clear the state
    if (isTransitioningRef.current) {
      isTransitioningRef.current = false;
      return;
    }

    setModalState({
      type: null,
      payload: undefined,
      resolver: undefined,
    });
  }, []);

  // Special function to transition to another modal without closing (to avoid flash)
  const transitionToModal = useCallback(
    (type: ModalType, payload?: any, resolver?: (value: any) => void) => {
      isTransitioningRef.current = true;
      setModalState({
        type,
        payload,
        resolver,
      });
    },
    [],
  );

  // Auth modal handlers
  const openAuthModal = useCallback(
    (resolver: (value: any) => void) => {
      openModal("auth", undefined, resolver);
    },
    [openModal],
  );

  const closeAuthModal = useCallback(
    (address?: string) => {
      if (address) {
        closeModal({ address });
      } else {
        closeModal();
      }
    },
    [closeModal],
  );

  // Signing modal handlers
  const openSigningModal = useCallback(
    (
      transaction: SignTransactionPayload["transaction"],
      resolver: (value: any) => void,
    ) => {
      setIsTransitioning(true);
      setTimeout(() => {
        openModal("signing", { transaction }, resolver);
        setIsTransitioning(false);
      }, 300);
    },
    [openModal],
  );

  const closeSigningModal = useCallback(
    (result?: any) => {
      closeModal(result);
    },
    [closeModal],
  );

  // Add authenticator modal handlers
  const openAddAuthModal = useCallback(
    (payload: AddAuthenticatorPayload, resolver: (value: any) => void) => {
      openModal("addAuth", payload, resolver);
    },
    [openModal],
  );

  const closeAddAuthModal = useCallback(
    (result?: any) => {
      closeModal(result);
    },
    [closeModal],
  );

  // Remove authenticator modal handlers
  const openRemoveAuthModal = useCallback(
    (authenticatorId: number, resolver: (value: any) => void) => {
      openModal("removeAuth", { authenticatorId }, resolver);
    },
    [openModal],
  );

  const closeRemoveAuthModal = useCallback(
    (result?: any) => {
      closeModal(result);
    },
    [closeModal],
  );

  // Grant modal handlers
  const openGrantModal = useCallback(
    (
      treasuryAddress: string,
      grantee: string,
      resolver: (value: any) => void,
    ) => {
      openModal("grant", { treasuryAddress, grantee }, resolver);
    },
    [openModal],
  );

  const closeGrantModal = useCallback(
    (success: boolean) => {
      closeModal({ success });
    },
    [closeModal],
  );

  // Notify parent when modal state changes
  useEffect(() => {
    const hasModalOpen = modalState.type !== null;
    console.log("[useIframeModals] Modal state change:", {
      type: modalState.type,
      hasModalOpen,
    });
    window.parent.postMessage(
      {
        type: "MODAL_STATE_CHANGE",
        isOpen: hasModalOpen,
      },
      "*",
    );
  }, [modalState.type]);

  // Memoize computed states
  const showAuthModal = modalState.type === "auth";
  const showSigningModal = modalState.type === "signing";
  const showAddAuthModal = modalState.type === "addAuth";
  const showRemoveAuthModal = modalState.type === "removeAuth";
  const showGrantModal = modalState.type === "grant";

  // Memoize the entire return object to provide stable reference
  return useMemo(
    () => ({
      // State
      modalState,
      isTransitioning,

      // Computed states for backwards compatibility
      showAuthModal,
      showSigningModal,
      showAddAuthModal,
      showRemoveAuthModal,
      showGrantModal,

      // Modal handlers
      openAuthModal,
      closeAuthModal,
      openSigningModal,
      closeSigningModal,
      openAddAuthModal,
      closeAddAuthModal,
      openRemoveAuthModal,
      closeRemoveAuthModal,
      openGrantModal,
      closeGrantModal,

      // Generic handlers
      openModal,
      closeModal,
      transitionToModal,
    }),
    [
      modalState,
      isTransitioning,
      showAuthModal,
      showSigningModal,
      showAddAuthModal,
      showRemoveAuthModal,
      showGrantModal,
      openAuthModal,
      closeAuthModal,
      openSigningModal,
      closeSigningModal,
      openAddAuthModal,
      closeAddAuthModal,
      openRemoveAuthModal,
      closeRemoveAuthModal,
      openGrantModal,
      closeGrantModal,
      openModal,
      closeModal,
      transitionToModal,
    ],
  );
}
