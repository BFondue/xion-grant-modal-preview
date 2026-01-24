import { useEffect } from "react";
import { IframeMessageHandler } from "../../../messaging/handler";
import type {
  ConnectResponse,
  SignTransactionPayload,
  SignTransactionResponse,
  AddAuthenticatorPayload,
  AddAuthenticatorResponse,
  RemoveAuthenticatorPayload,
  RemoveAuthenticatorResponse,
  RequestGrantPayload,
  RequestGrantResponse,
  DisconnectResponse,
} from "../../../messaging/types";

interface MessageHandlerCallbacks {
  onConnect: (origin: string) => Promise<ConnectResponse>;
  onSignTransaction: (
    origin: string,
    payload: SignTransactionPayload,
  ) => Promise<SignTransactionResponse>;
  onSignAndBroadcast: (
    origin: string,
    payload: SignTransactionPayload,
  ) => Promise<any>;
  onGetAddress: (origin: string) => { address: string | null };
  onDisconnect: (origin: string) => Promise<DisconnectResponse>;
  onAddAuthenticator: (
    origin: string,
    payload: AddAuthenticatorPayload,
  ) => Promise<AddAuthenticatorResponse>;
  onRemoveAuthenticator: (
    origin: string,
    payload: RemoveAuthenticatorPayload,
  ) => Promise<RemoveAuthenticatorResponse>;
  onRequestGrant: (
    origin: string,
    payload: RequestGrantPayload,
  ) => Promise<RequestGrantResponse>;
}

/**
 * Custom hook to manage iframe message handler lifecycle
 * Automatically sets up and cleans up the message handler
 */
export function useIframeMessageHandler(callbacks: MessageHandlerCallbacks) {
  useEffect(() => {
    const handler = new IframeMessageHandler(callbacks);

    return () => {
      handler.destroy();
    };
  }, [
    callbacks.onConnect,
    callbacks.onSignTransaction,
    callbacks.onSignAndBroadcast,
    callbacks.onGetAddress,
    callbacks.onDisconnect,
    callbacks.onAddAuthenticator,
    callbacks.onRemoveAuthenticator,
    callbacks.onRequestGrant,
  ]);

  // Notify parent that iframe is ready
  useEffect(() => {
    window.parent.postMessage({ type: "IFRAME_READY" }, "*");
  }, []);
}
