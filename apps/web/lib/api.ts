// Web binding of the shared @tally/api-client. All request logic + types live in
// the package; here we just supply the web base URL (and could add a token
// getter for cookie/JWT auth later). Re-export types so existing imports from
// "@/lib/api" keep working.
import { createTallyClient } from "@tally/api-client";

export * from "@tally/api-client";

export const api = createTallyClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
});
