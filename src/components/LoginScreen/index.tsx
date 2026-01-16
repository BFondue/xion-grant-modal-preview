/**
 * AbstraxionSignin - Login UI component for XION authentication
 *
 * This component has been updated to use AuthStateManager for login state management.
 * Key changes:
 * - Uses startLogin, completeLogin, setOkxData from useAuthState
 * - No more direct localStorage.setItem calls - AuthStateManager handles it
 * - Cleaner flow: startLogin() when auth starts, completeLogin() when account is ready
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { stytchClient as stytchClientSingleton } from "../../hooks/useStytchClient";
import { get } from "@github/webauthn-json/browser-ponyfill";
import {
  BaseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  KeplrLogo,
  MetamaskLogo,
  NavigationButton,
  PasskeyIcon,
  AppleLogoIcon,
} from "../ui";
import { AuthContext, AuthContextProps } from "../AuthContext";
import { getHumanReadablePubkey } from "../../utils";
import {
  convertToStandardBase64,
  registeredCredentials,
} from "../../auth/passkey";
import okxLogo from "../../assets/okx-logo.png";
import { useShuttle } from "@delphi-labs/shuttle-react";
import LoginOtpForm from "../LoginOtpForm";
import { GoogleLogoIcon } from "../ui/icons/GoogleLogo";
import { TikTokLogoIcon } from "../ui/icons/TikTokLogo";
import { cn } from "../../utils/classname-util";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import xionLogo from "../../assets/logo.png";
import { createJwtAccount } from "../../hooks/useCreateJwtAccount";
import { useAuthState } from "../../auth/useAuthState";
import { getLoginAuthenticatorFromJWT } from "../../auth/session";
import { CONNECTION_TYPE } from "../../auth/AuthStateManager";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";
import {
  NETWORK,
  FEATURE_FLAGS,
  STYTCH_PUBLIC_TOKEN,
  STYTCH_PROXY_URL,
} from "../../config";

export const LoginScreen = () => {
  const stytchClient = stytchClientSingleton;

  const [email, setEmail] = useState("");
  const [methodId, setMethodId] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isOnOtpStep, setIsOnOtpStep] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isRedirectingToOAuth, setIsRedirectingToOAuth] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const tokenProcessed = useRef(false);

  const { connect } = useShuttle();

  // Use AuthStateManager via hook
  const { startLogin, setOkxData, setError: setAuthError } = useAuthState();

  // Keep context for backward compatibility
  const { setConnectionType, setAbstraxionError, apiUrl, chainInfo } =
    useContext(AuthContext) as AuthContextProps;

  // Detect if running in iframe mode - browser extensions don't work directly in iframes
  // but we can use popups to connect to wallets
  const isInIframe =
    typeof window !== "undefined" && window.self !== window.top;

  // Feature flags from config already account for mainnet/testnet
  const shouldEnableOkx = FEATURE_FLAGS.okx;
  const shouldEnableMetamask = FEATURE_FLAGS.metamask;
  const shouldEnableKeplr = FEATURE_FLAGS.keplr;

  /**
   * Handles post-authentication account creation/lookup.
   * Called after successful Stytch authentication to create or retrieve the abstract account.
   */
  const handlePostAuthentication = useCallback(
    async (sessionJwt: string, sessionToken: string): Promise<boolean> => {
      if (!apiUrl) {
        console.error("[AbstraxionSignin] API URL not available");
        setAbstraxionError("Configuration error: API URL not set");
        setAuthError("Configuration error: API URL not set");
        return false;
      }

      try {
        setIsCreatingAccount(true);
        console.log(
          "[AbstraxionSignin] Creating/retrieving abstract account...",
        );

        // Start login via AuthStateManager
        const loginAuthenticator = getLoginAuthenticatorFromJWT(sessionJwt);
        if (loginAuthenticator) {
          startLogin(
            CONNECTION_TYPE.Stytch,
            loginAuthenticator,
            AUTHENTICATOR_TYPE.JWT,
          );
        }

        const account = await createJwtAccount({
          sessionJwt,
          sessionToken,
        });

        console.log("[AbstraxionSignin] Account ready:", account.id);

        // Don't call completeLogin here - baseSmartAccount hook will complete it with full data
        // Don't set abstractAccount here - let baseSmartAccount hook fetch it with all authenticators

        return true;
      } catch (error: any) {
        console.error("[AbstraxionSignin] Account creation failed:", error);
        const errorMessage =
          error?.message ||
          (typeof error === "string" ? error : "Unknown error");
        setAbstraxionError(`Account creation failed: ${errorMessage}`);
        setAuthError(`Account creation failed: ${errorMessage}`);
        return false;
      } finally {
        setIsCreatingAccount(false);
      }
    },
    [apiUrl, setAbstraxionError, startLogin, setAuthError],
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailError("");
    let newEmail = e.currentTarget.value.toLowerCase().trim();
    const chainId = chainInfo?.chainId || "";
    if (chainId && chainId === "xion-testnet-1") {
      newEmail = e.currentTarget.value.toLowerCase();
    }
    setEmail(newEmail);
  };

  const EMAIL_REGEX = /\S+@\S+\.\S+/;
  const validateEmail = () => {
    if (EMAIL_REGEX.test(email) || email === "") {
      setEmailError("");
    } else {
      setEmailError("Invalid Email Format");
    }
  };

  const loginWithGoogle = useCallback(async () => {
    setIsRedirectingToOAuth(true);

    const origin = window.location.origin;
    // Redirect to our callback page
    const redirectUrl = `${origin}/callback`;

    // Manually construct OAuth URL to open in popup instead of redirecting iframe
    const publicToken = STYTCH_PUBLIC_TOKEN;
    const baseUrl = STYTCH_PROXY_URL || window.location.origin;
    const googleOAuthUrl =
      `${baseUrl}/public/oauth/google/start?` +
      `public_token=${publicToken}&` +
      `login_redirect_url=${encodeURIComponent(redirectUrl)}&` +
      `signup_redirect_url=${encodeURIComponent(redirectUrl)}&` +
      `prompt=select_account`;

    const popup = window.open(
      googleOAuthUrl,
      "Google Login",
      "width=500,height=600,popup=yes",
    );

    if (!popup) {
      console.error("[AbstraxionSignin] Popup was blocked");
      alert("Please allow popups for this site to sign in with Google");
    }

    // Listen for the OAuth callback message
    const handleOAuthMessage = async (event: MessageEvent) => {
      // In production, verify event.origin matches your domain
      if (event.data.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleOAuthMessage);

        try {
          if (!stytchClient || !stytchClient.oauth) {
            console.error(
              "[AbstraxionSignin] Stytch client not properly initialized",
            );
            setIsRedirectingToOAuth(false);
            return;
          }

          const response = await stytchClient.oauth.authenticate(
            event.data.token,
            {
              session_duration_minutes: 60 * 24 * 3,
            },
          );

          console.log(
            "[AbstraxionSignin] OAuth authenticate response:",
            response,
          );

          // Create/retrieve abstract account after successful authentication
          if (response.session_jwt && response.session_token) {
            await handlePostAuthentication(
              response.session_jwt,
              response.session_token,
            );
          } else {
            console.error(
              "[AbstraxionSignin] Missing session credentials in response",
            );
          }
          setIsRedirectingToOAuth(false);
        } catch (error: any) {
          console.error(
            "[AbstraxionSignin] OAuth authentication error:",
            error,
          );
          setIsRedirectingToOAuth(false);
        }
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("[AbstraxionSignin] OAuth error:", event.data);
        window.removeEventListener("message", handleOAuthMessage);
        setIsRedirectingToOAuth(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
  }, [stytchClient, handlePostAuthentication]);

  const loginWithApple = useCallback(async () => {
    setIsRedirectingToOAuth(true);

    const origin = window.location.origin;
    // Redirect to our callback page
    const redirectUrl = `${origin}/callback`;

    const publicToken = STYTCH_PUBLIC_TOKEN;
    const baseUrl = STYTCH_PROXY_URL || window.location.origin;
    const appleOAuthUrl =
      `${baseUrl}/public/oauth/apple/start?` +
      `public_token=${publicToken}&` +
      `login_redirect_url=${encodeURIComponent(redirectUrl)}&` +
      `signup_redirect_url=${encodeURIComponent(redirectUrl)}`;

    const popup = window.open(
      appleOAuthUrl,
      "Apple Login",
      "width=500,height=600,popup=yes",
    );

    if (!popup) {
      console.error("[AbstraxionSignin] Popup was blocked");
      alert("Please allow popups for this site to sign in with Apple");
      setIsRedirectingToOAuth(false);
      return;
    }

    // Listen for the OAuth callback message
    const handleOAuthMessage = async (event: MessageEvent) => {
      // In production, verify event.origin matches your domain
      if (event.data.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleOAuthMessage);

        try {
          if (!stytchClient || !stytchClient.oauth) {
            console.error(
              "[AbstraxionSignin] Stytch client not properly initialized",
            );
            setIsRedirectingToOAuth(false);
            return;
          }

          const token = event.data.token;
          console.log(
            "[AbstraxionSignin] Received Apple OAuth token from popup",
          );

          // Authenticate with the token
          const response = await stytchClient.oauth.authenticate(token, {
            session_duration_minutes: 60 * 24 * 30,
          });

          console.log(
            "[AbstraxionSignin] Apple OAuth authenticate response:",
            response,
          );

          // Create/retrieve abstract account after successful authentication
          if (response.session_jwt && response.session_token) {
            await handlePostAuthentication(
              response.session_jwt,
              response.session_token,
            );
          } else {
            console.error(
              "[AbstraxionSignin] Missing session credentials in response",
            );
          }
          setIsRedirectingToOAuth(false);
        } catch (error) {
          console.error(
            "[AbstraxionSignin] Apple OAuth authentication failed:",
            error,
          );
          setAbstraxionError("Apple authentication failed");
          setIsRedirectingToOAuth(false);
        }
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("[AbstraxionSignin] Apple OAuth error:", event.data);
        window.removeEventListener("message", handleOAuthMessage);
        setIsRedirectingToOAuth(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
  }, [stytchClient, setAbstraxionError, handlePostAuthentication]);

  const loginWithTikTok = useCallback(async () => {
    setIsRedirectingToOAuth(true);

    const origin = window.location.origin;
    // Redirect to our callback page
    const redirectUrl = `${origin}/callback`;

    const publicToken = STYTCH_PUBLIC_TOKEN;
    const baseUrl = STYTCH_PROXY_URL || window.location.origin;
    const tiktokOAuthUrl =
      `${baseUrl}/public/oauth/tiktok/start?` +
      `public_token=${publicToken}&` +
      `login_redirect_url=${encodeURIComponent(redirectUrl)}&` +
      `signup_redirect_url=${encodeURIComponent(redirectUrl)}`;

    const popup = window.open(
      tiktokOAuthUrl,
      "TikTok Login",
      "width=500,height=600,popup=yes",
    );

    if (!popup) {
      console.error("[AbstraxionSignin] Popup was blocked");
      alert("Please allow popups for this site to sign in with TikTok");
      setIsRedirectingToOAuth(false);
      return;
    }

    // Listen for the OAuth callback message
    const handleOAuthMessage = async (event: MessageEvent) => {
      // In production, verify event.origin matches your domain
      if (event.data.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleOAuthMessage);

        try {
          if (!stytchClient || !stytchClient.oauth) {
            console.error(
              "[AbstraxionSignin] Stytch client not properly initialized",
            );
            setIsRedirectingToOAuth(false);
            return;
          }

          const token = event.data.token;
          console.log(
            "[AbstraxionSignin] Received TikTok OAuth token from popup",
          );

          // Authenticate with the token
          const response = await stytchClient.oauth.authenticate(token, {
            session_duration_minutes: 60 * 24 * 30,
          });

          console.log(
            "[AbstraxionSignin] TikTok OAuth authenticate response:",
            response,
          );

          // Create/retrieve abstract account after successful authentication
          if (response.session_jwt && response.session_token) {
            await handlePostAuthentication(
              response.session_jwt,
              response.session_token,
            );
          } else {
            console.error(
              "[AbstraxionSignin] Missing session credentials in response",
            );
          }
          setIsRedirectingToOAuth(false);
        } catch (error) {
          console.error(
            "[AbstraxionSignin] TikTok OAuth authentication failed:",
            error,
          );
          setAbstraxionError("TikTok authentication failed");
          setIsRedirectingToOAuth(false);
        }
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("[AbstraxionSignin] TikTok OAuth error:", event.data);
        window.removeEventListener("message", handleOAuthMessage);
        setIsRedirectingToOAuth(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
  }, [stytchClient, setAbstraxionError, handlePostAuthentication]);

  const handleEmail = async () => {
    if (!email) {
      setEmailError("Please enter your email");
      return;
    }

    if (!stytchClient || !stytchClient.otps || !stytchClient.otps.email) {
      console.error(
        "[AbstraxionSignin] Stytch client not properly initialized",
      );
      setEmailError("Authentication service not available");
      return;
    }

    try {
      setIsSendingEmail(true);
      setConnectionType("stytch");
      const emailRes = await stytchClient.otps.email.loginOrCreate(email, {
        login_template_id: "xion_otp",
        signup_template_id: "xion_otp_signup",
        expiration_minutes: 2,
      });
      setMethodId(emailRes.method_id);
      setIsOnOtpStep(true);
    } catch (error) {
      console.error("[AbstraxionSignin] Error sending email:", error);
      setEmailError("Error sending email");
      setConnectionType("none");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleOtp = async (otpCode: string) => {
    if (!stytchClient || !stytchClient.otps) {
      console.error(
        "[AbstraxionSignin] Stytch client not properly initialized",
      );
      setOtpError("Authentication service not available");
      return;
    }

    try {
      const response = await stytchClient.otps.authenticate(otpCode, methodId, {
        session_duration_minutes: 60 * 24 * 3,
      });

      console.log("[AbstraxionSignin] OTP authenticate response:", response);

      // Create/retrieve abstract account after successful authentication
      if (response.session_jwt && response.session_token) {
        await handlePostAuthentication(
          response.session_jwt,
          response.session_token,
        );
      } else {
        console.error(
          "[AbstraxionSignin] Missing session credentials in response",
        );
      }
    } catch {
      setOtpError("Error Verifying OTP Code");
    }
  };

  function handleKeplr() {
    console.log(
      "[AbstraxionSignin] handleKeplr called, isInIframe:",
      isInIframe,
    );

    // In iframe mode, use popup to connect to wallet
    if (isInIframe) {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/callback?wallet=keplr`;
      const popup = window.open(
        callbackUrl,
        "Keplr Wallet",
        "width=500,height=600,popup=yes",
      );

      if (!popup) {
        alert("Please allow popups for this site to connect with Keplr");
        return;
      }

      const handleWalletMessage = (event: MessageEvent) => {
        if (
          event.data.type === "WALLET_SUCCESS" &&
          event.data.data.walletType === "keplr"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          const { authenticator, address, name } = event.data.data;
          console.log("[AbstraxionSignin] Keplr connected via popup:", {
            authenticator,
            address,
            name,
          });

          // Use AuthStateManager
          startLogin(
            CONNECTION_TYPE.Shuttle,
            authenticator,
            AUTHENTICATOR_TYPE.Secp256K1,
          );

          // Also update context for backward compatibility
          setConnectionType("shuttle");
        } else if (
          event.data.type === "WALLET_ERROR" &&
          event.data.walletType === "keplr"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          console.error("[AbstraxionSignin] Keplr error:", event.data.error);
          setAbstraxionError(event.data.error || "Keplr wallet connect error");
        }
      };

      window.addEventListener("message", handleWalletMessage);
      return;
    }

    // Direct connection (not in iframe)
    if (!window.keplr) {
      alert("Please install the Keplr wallet extension");
      return;
    }

    try {
      connect({
        chainId: `${chainInfo?.chainId}`,
        extensionProviderId: "keplr",
      });

      // Use AuthStateManager - authenticator will be set when wallet connects
      startLogin(CONNECTION_TYPE.Shuttle, "", AUTHENTICATOR_TYPE.Secp256K1); // Will be updated when wallet connects
      setConnectionType("shuttle");
      console.log("[AbstraxionSignin] Keplr connection initiated");
    } catch (error) {
      console.error("Error connecting to Keplr:", error);
    }
  }

  async function handleOkx() {
    console.log("[AbstraxionSignin] handleOkx called, isInIframe:", isInIframe);

    // In iframe mode, use popup to connect to wallet
    if (isInIframe) {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/callback?wallet=okx`;
      const popup = window.open(
        callbackUrl,
        "OKX Wallet",
        "width=500,height=600,popup=yes",
      );

      if (!popup) {
        alert("Please allow popups for this site to connect with OKX");
        return;
      }

      const handleWalletMessage = (event: MessageEvent) => {
        if (
          event.data.type === "WALLET_SUCCESS" &&
          event.data.data.walletType === "okx"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          const { authenticator, address, name } = event.data.data;
          console.log("[AbstraxionSignin] OKX connected via popup:", {
            authenticator,
            address,
            name,
          });

          // Use AuthStateManager
          startLogin(
            CONNECTION_TYPE.OKX,
            authenticator,
            AUTHENTICATOR_TYPE.Secp256K1,
          );
          setOkxData(address, name || "");

          // Also update context for backward compatibility
          setConnectionType("okx");
        } else if (
          event.data.type === "WALLET_ERROR" &&
          event.data.walletType === "okx"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          console.error("[AbstraxionSignin] OKX error:", event.data.error);
          setAbstraxionError(event.data.error || "OKX wallet connect error");
        }
      };

      window.addEventListener("message", handleWalletMessage);
      return;
    }

    // Direct connection (not in iframe)
    if (!window.okxwallet) {
      alert("Please install the OKX wallet extension");
      return;
    }
    try {
      if (!chainInfo) {
        throw new Error("No chain info available");
      }
      const keplr = window.okxwallet.keplr;
      if (!keplr) {
        throw new Error("OKX Keplr extension not found");
      }
      console.log(
        "[AbstraxionSignin] Enabling OKX wallet for chainId:",
        chainInfo.chainId,
      );

      // First, try to suggest the chain (OKX might not have Xion configured)
      try {
        await keplr.experimentalSuggestChain(chainInfo as any);
        console.log("[AbstraxionSignin] OKX chain suggested successfully");
      } catch (suggestError) {
        console.log(
          "[AbstraxionSignin] Chain already exists or suggest failed:",
          suggestError,
        );
        // Continue anyway - chain might already be added
      }

      await keplr.enable(chainInfo.chainId);
      const okxAccount = await keplr.getKey(chainInfo.chainId);
      const authenticator = getHumanReadablePubkey(okxAccount.pubKey);
      console.log("[AbstraxionSignin] OKX account:", okxAccount);
      console.log("[AbstraxionSignin] OKX authenticator:", authenticator);

      // Use AuthStateManager
      startLogin(
        CONNECTION_TYPE.OKX,
        authenticator,
        AUTHENTICATOR_TYPE.Secp256K1,
      );
      setOkxData(okxAccount.bech32Address, okxAccount.name);

      // Also update context for backward compatibility
      setConnectionType("okx");
      console.log("[AbstraxionSignin] OKX wallet connected");
    } catch (error) {
      console.error("[AbstraxionSignin] OKX error:", error);
      setAbstraxionError("OKX wallet connect error");
    }
  }

  async function handleMetamask() {
    console.log(
      "[AbstraxionSignin] handleMetamask called, isInIframe:",
      isInIframe,
    );

    // In iframe mode, use popup to connect to wallet
    if (isInIframe) {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/callback?wallet=metamask`;
      const popup = window.open(
        callbackUrl,
        "MetaMask Wallet",
        "width=500,height=600,popup=yes",
      );

      if (!popup) {
        alert("Please allow popups for this site to connect with MetaMask");
        return;
      }

      const handleWalletMessage = (event: MessageEvent) => {
        if (
          event.data.type === "WALLET_SUCCESS" &&
          event.data.data.walletType === "metamask"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          const { authenticator } = event.data.data;
          console.log(
            "[AbstraxionSignin] MetaMask connected via popup:",
            authenticator,
          );

          // Use AuthStateManager
          startLogin(
            CONNECTION_TYPE.Metamask,
            authenticator,
            AUTHENTICATOR_TYPE.EthWallet,
          );

          // Also update context for backward compatibility
          setConnectionType("metamask");
        } else if (
          event.data.type === "WALLET_ERROR" &&
          event.data.walletType === "metamask"
        ) {
          window.removeEventListener("message", handleWalletMessage);
          console.error("[AbstraxionSignin] MetaMask error:", event.data.error);
          setAbstraxionError(event.data.error || "MetaMask connect error");
        }
      };

      window.addEventListener("message", handleWalletMessage);
      return;
    }

    // Direct connection (not in iframe)
    if (!window.ethereum) {
      alert("Please install the Metamask wallet extension");
      return;
    }
    try {
      console.log("[AbstraxionSignin] Requesting Metamask accounts");
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as Array<string>;
      console.log("[AbstraxionSignin] Metamask accounts:", accounts);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in Metamask");
      }
      const primaryAccount = accounts[0];

      // Use AuthStateManager
      startLogin(
        CONNECTION_TYPE.Metamask,
        primaryAccount,
        AUTHENTICATOR_TYPE.EthWallet,
      );

      // Also update context for backward compatibility
      setConnectionType("metamask");
      console.log("[AbstraxionSignin] Metamask connected:", primaryAccount);
    } catch (error) {
      console.error("[AbstraxionSignin] Metamask error:", error);
      setAbstraxionError("Metamask connect error");
    }
  }

  const getPasskey = async () => {
    try {
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: registeredCredentials(),
          userVerification: "preferred",
        },
      };

      const publicKeyCredential = await get(options);
      if (!publicKeyCredential) throw new Error("Error getting webauthn key");

      const credentialId = convertToStandardBase64(publicKeyCredential.id);

      // Use AuthStateManager
      startLogin(
        CONNECTION_TYPE.Passkey,
        credentialId,
        AUTHENTICATOR_TYPE.Passkey,
      );

      // Also update context for backward compatibility
      setConnectionType("passkey");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const authenticateUser = async () => {
      // Check both query params (popup flow) and hash params (main window flow)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const token = urlParams.get("token") || hashParams.get("oauth_token");
      // const tokenType = urlParams.get("stytch_token_type") || hashParams.get("token_type");

      if (token && !tokenProcessed.current) {
        tokenProcessed.current = true;
        try {
          if (!stytchClient || !stytchClient.oauth) {
            console.error(
              "[AbstraxionSignin] Stytch client not properly initialized",
            );
            setAbstraxionError("Authentication service not available");
            return;
          }

          const response = await stytchClient.oauth.authenticate(token, {
            session_duration_minutes: 60 * 24 * 3,
          });

          console.log(
            "[AbstraxionSignin] OAuth authenticate response:",
            response,
          );

          // Create/retrieve abstract account after successful authentication
          // Use session_token if available, otherwise session_jwt
          const sessionToken = response.session_token || "";
          const sessionJwt = response.session_jwt || "";

          if (sessionJwt || sessionToken) {
            await handlePostAuthentication(sessionJwt, sessionToken);
          } else {
            console.error(
              "[AbstraxionSignin] Missing session credentials in response",
            );
          }
        } catch (error) {
          console.error(
            "[AbstraxionSignin] OAuth authentication error:",
            error,
          );
          setAbstraxionError("Social authentication failed");
        } finally {
          // Clean up OAuth params from both URL and hash
          urlParams.delete("token");
          urlParams.delete("stytch_token_type");

          const newUrl = urlParams.toString()
            ? `${window.location.origin}?${urlParams.toString()}`
            : window.location.origin;

          // Also clear hash
          window.history.replaceState(null, "", newUrl);
        }
      }
    };

    authenticateUser();
  }, []);

  if (isRedirectingToOAuth || isCreatingAccount) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {isCreatingAccount ? "Setting Up Account" : "Verifying Login"}
          </DialogTitle>
          <DialogDescription>
            {isCreatingAccount
              ? "Creating your XION account..."
              : "Please complete the login in the popup window."}
          </DialogDescription>
        </DialogHeader>
        <div className="ui-flex ui-items-center ui-justify-center ui-my-20">
          <SpinnerV2 size="lg" color="white" />
        </div>
        <DialogFooter>
          <img
            src={xionLogo}
            alt="XION Logo"
            width="90"
            height="32"
            className="ui-mx-auto"
          />
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      {isOnOtpStep ? (
        <>
          <DialogHeader>
            <DialogTitle>Input 6 Digit Code</DialogTitle>
            <DialogDescription>
              Please check your email for the verification code
            </DialogDescription>
          </DialogHeader>
          <LoginOtpForm
            error={otpError}
            setError={setOtpError}
            handleOtp={handleOtp}
            handleResendCode={handleEmail}
          />
        </>
      ) : (
        <>
          <DialogHeader>
            <div className="ui-flex ui-flex-col ui-items-center ui-gap-2 ui-w-full">
              <div className="ui-flex ui-items-center ui-space-x-3">
                <img
                  src={xionLogo}
                  alt="XION Logo"
                  width="108"
                  height="39"
                  className="ui-mb-2"
                />
                <div className="ui-flex ui-justify-between ui-items-center ui-h-[18px] ui-bg-testnet-bg ui-px-1 ui-py-0 ui-mb-2 ui-text-testnet ui-rounded-[4px] ui-text-[10px] ui-tracking-widest">
                  {NETWORK.toUpperCase()}
                </div>
              </div>
              <DialogDescription>
                Log in or sign up with your email
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="ui-flex ui-flex-col ui-gap-6 ui-w-full">
            <div className="ui-flex ui-flex-col ui-gap-4">
              <Input
                baseInputClassName="!ui-text-[16px]"
                placeholder="Email"
                value={email}
                onChange={handleEmailChange}
                error={emailError}
                onBlur={validateEmail}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
              />
              <BaseButton
                onClick={handleEmail}
                disabled={!!emailError || isSendingEmail}
                className={"ui-mt-2"}
              >
                {isSendingEmail ? (
                  <SpinnerV2 size="sm" color="black" />
                ) : (
                  "LOG IN / SIGN UP"
                )}
              </BaseButton>
            </div>
            <div className="ui-flex ui-items-center ui-justify-center ui-gap-3">
              <span className="ui-h-px ui-bg-border ui-w-full" />
              <h6 className="ui-text-xs ui-text-secondary-text">OR</h6>
              <span className="ui-h-px ui-bg-border ui-w-full" />
            </div>
            <div className="ui-flex ui-flex-col ui-gap-2">
              <NavigationButton
                icon={<GoogleLogoIcon />}
                onClick={loginWithGoogle}
              >
                Google
              </NavigationButton>
              {FEATURE_FLAGS.apple && (
                <NavigationButton
                  icon={<AppleLogoIcon />}
                  onClick={loginWithApple}
                >
                  Apple
                </NavigationButton>
              )}
              {FEATURE_FLAGS.tiktok && (
                <NavigationButton
                  icon={<TikTokLogoIcon />}
                  onClick={loginWithTikTok}
                >
                  TikTok
                </NavigationButton>
              )}
            </div>
          </div>
          {shouldEnableOkx || shouldEnableMetamask ? (
            <div className="ui-w-full ui-mb-12 sm:ui-mb-0 ui-flex ui-flex-col ui-gap-3">
              <button
                className="group ui-flex ui-w-full ui-items-center ui-gap-3"
                onClick={() => setShowAdvanced((showAdvanced) => !showAdvanced)}
              >
                Advanced Options
                <span className="ui-text-secondary-text">{"(Login Only)"}</span>
                {/* Down Caret */}
                <ChevronRightIcon
                  className={cn(
                    "ui-fill-white/50 ui-rotate-180 group-hover/base button:ui-fill-white",
                    showAdvanced ? "-ui-rotate-[90deg]" : "ui-rotate-90",
                  )}
                />
              </button>
              {showAdvanced ? (
                <div className="ui-flex ui-w-full ui-gap-2">
                  {shouldEnableOkx ? (
                    <BaseButton
                      variant="secondary"
                      size="icon-large"
                      onClick={handleOkx}
                    >
                      <img
                        src={okxLogo}
                        height={82}
                        width={50}
                        alt="OKX Logo"
                        className="ui-min-w-7"
                      />
                    </BaseButton>
                  ) : null}
                  {shouldEnableKeplr ? (
                    <BaseButton
                      variant="secondary"
                      size="icon-large"
                      onClick={handleKeplr}
                    >
                      <KeplrLogo className="ui-min-w-6 ui-min-h-6" />
                    </BaseButton>
                  ) : null}
                  {shouldEnableMetamask ? (
                    <BaseButton
                      variant="secondary"
                      size="icon-large"
                      onClick={handleMetamask}
                    >
                      <MetamaskLogo className="ui-min-w-6 ui-min-h-6" />
                    </BaseButton>
                  ) : null}
                  {FEATURE_FLAGS.passkey ? (
                    <BaseButton
                      variant="secondary"
                      size="icon-large"
                      onClick={getPasskey}
                      className="ui-relative"
                    >
                      <span className="ui-absolute ui-top-0 ui-right-0 ui-bg-neutral-500/50 ui-text-white ui-text-[10px] ui-leading-none ui-font-bold ui-px-1 ui-py-0.5 ui-rounded-[7px] ui-rounded-br-none ui-rounded-tl-none">
                        BETA
                      </span>
                      <PasskeyIcon className="ui-min-w-6 ui-min-h-6" />
                    </BaseButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {/* Disclaimer */}
      <div className="ui-text-xs ui-font-normal ui-leading-5 ui-text-center ui-max-w-[340px] ui-mx-auto ui-mt-4">
        <span className="ui-text-secondary-text">
          By continuing, you agree to and acknowledge that you have read and
          understand the{" "}
        </span>
        <a
          href="https://burnt.com/terms-and-conditions"
          target="_blank"
          rel="noreferrer"
          className="ui-text-white ui-underline ui-font-bold"
        >
          Disclaimer
        </a>
        <span className="ui-text-secondary-text">.</span>
      </div>
    </>
  );
};
