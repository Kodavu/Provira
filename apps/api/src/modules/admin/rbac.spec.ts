import { describe, expect, it } from "vitest";
import { clientIp, ipAllowed } from "./rbac.js";

describe("ipAllowed", () => {
  it("allows everything when the allowlist is unset (dev default)", () => {
    expect(ipAllowed("8.8.8.8", undefined)).toBe(true);
    expect(ipAllowed("8.8.8.8", "")).toBe(true);
  });

  it("allows everything on an explicit wildcard", () => {
    expect(ipAllowed("8.8.8.8", "*")).toBe(true);
    expect(ipAllowed("8.8.8.8", "10.0.0.0/8, *")).toBe(true);
  });

  it("matches an exact IP and rejects others", () => {
    expect(ipAllowed("203.0.113.5", "203.0.113.5")).toBe(true);
    expect(ipAllowed("203.0.113.6", "203.0.113.5")).toBe(false);
  });

  it("matches inside a CIDR range and rejects outside it", () => {
    expect(ipAllowed("10.1.2.3", "10.0.0.0/8")).toBe(true);
    expect(ipAllowed("11.1.2.3", "10.0.0.0/8")).toBe(false);
  });

  it("honours the prefix width on a tight CIDR", () => {
    expect(ipAllowed("192.168.1.10", "192.168.1.0/24")).toBe(true);
    expect(ipAllowed("192.168.2.10", "192.168.1.0/24")).toBe(false);
  });

  it("normalises IPv4-mapped IPv6 addresses", () => {
    expect(ipAllowed("::ffff:10.1.2.3", "10.0.0.0/8")).toBe(true);
  });

  it("supports mixed exact + CIDR entries", () => {
    const list = "10.0.0.0/8, 203.0.113.5";
    expect(ipAllowed("10.9.9.9", list)).toBe(true);
    expect(ipAllowed("203.0.113.5", list)).toBe(true);
    expect(ipAllowed("8.8.8.8", list)).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers the first hop in x-forwarded-for", () => {
    const req = { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" }, ip: "127.0.0.1" };
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to req.ip when no forwarded header is present", () => {
    expect(clientIp({ headers: {}, ip: "127.0.0.1" })).toBe("127.0.0.1");
  });
});
