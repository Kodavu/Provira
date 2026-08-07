// Mobile binding of the shared @truvo/api-client. Supplies the mobile base URL
// and reads the auth token from SecureStore. All request logic + types live in
// the package; re-export types so screens keep importing from "@/lib/api".
import { createTruvoClient } from "@truvo/api-client";
import { session } from "./session";

export * from "@truvo/api-client";

export const api = createTruvoClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  getToken: () => session.token(),
});
