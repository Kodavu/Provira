// Shared primitives used across integration adapters. Kept in one place so the
// package doesn't export the same type name from multiple modules.
export type Language = "EN" | "PCM" | "YO" | "HA" | "IG";
export type Channel = "SMS" | "IVR" | "WHATSAPP";
