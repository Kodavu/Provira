"use client";

// Minimal client-side session. Phone-first users authenticate via OTP; we keep
// the token + userId in localStorage for this scaffold. (A production build would
// use httpOnly cookies + a refresh flow.)
const TOKEN_KEY = "provira.token";
const USER_KEY = "provira.userId";

export function saveSession(token: string, userId: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userId);
}

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
