import axios from "axios";
import { ABSTRAXION_API_URL } from "../../config";

export interface AuthenticatorTypeResponse {
  data: {
    [key: string]: string[];
  };
}

export async function getAuthenticatorTypes(userIds: string[]) {
  try {
    const response = await axios.post<AuthenticatorTypeResponse>(
      `${ABSTRAXION_API_URL}/api/v1/jwt-accounts/authenticator-types`,
      {
        user_ids: userIds,
      },
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}
