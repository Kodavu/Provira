// Mobile binding of the shared @provira/api-client. Supplies the mobile base URL
// and reads the auth token from SecureStore. All request logic + types live in
// the package; re-export types so screens keep importing from "@/lib/api".
import { createProviraClient } from "@provira/api-client";
import { session } from "./session";

export * from "@provira/api-client";

export const api = createProviraClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  getToken: () => session.token(),
});
