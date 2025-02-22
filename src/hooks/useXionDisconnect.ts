import { useContext } from "react";
import { AbstraxionContext } from "../components/AbstraxionContext";
import { useStytch } from "@stytch/react";
import { disconnect } from "graz";

export function useXionDisconnect() {
  const { connectionType, setConnectionType, setAbstractAccount, setIsOpen } =
    useContext(AbstraxionContext);

  const stytch = useStytch();

  const xionDisconnect = async () => {
    if (connectionType === "stytch") {
      await stytch.session.revoke();
    }
    disconnect();
    setConnectionType("none");
    setAbstractAccount(undefined);
    setIsOpen(false);
    localStorage.removeItem("loginType");
    localStorage.removeItem("loginAuthenticator");
    localStorage.removeItem("okxXionAddress");
    localStorage.removeItem("okxWalletName");
  };

  return { xionDisconnect };
}
