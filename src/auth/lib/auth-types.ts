import { getEnvStringOrThrow } from "../../utils";
import axios from "axios";

export interface AuthenticatorTypeResponse {
  data: {
    [key: string]: string[];
  };
}

export async function getAuthenticatorTypes(userIds: string[]) {
  try {
    const response = await axios.post<AuthenticatorTypeResponse>(
      `${getEnvStringOrThrow(
        "VITE_DEFAULT_API_URL",
        import.meta.env.VITE_DEFAULT_API_URL,
      )}/api/v1/jwt-accounts/authenticator-types`,
      {
        user_ids: userIds,
      },
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}
