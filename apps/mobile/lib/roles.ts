import type { Href } from "expo-router";

// Route a signed-in user to their dashboard based on role (employer > trader >
// worker when multiple).
export function routeForRoles(roles: string[]): Href {
  if (roles.includes("EMPLOYER")) return "/employer";
  if (roles.includes("TRADER")) return "/trader";
  return "/worker";
}
