// Web binding of the shared @provira/api-client. All request logic + types live in
// the package; here we just supply the web base URL (and could add a token
// getter for cookie/JWT auth later). Re-export types so existing imports from
// "@/lib/api" keep working.
import { createProviraClient } from "@provira/api-client";
import { getToken } from "./session";

export * from "@provira/api-client";

export const api = createProviraClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  // Attach the stored session token so owner-scoped routes (notifications,
  // wallet, …) authenticate as the signed-in user.
  getToken,
});
