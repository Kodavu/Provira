// Session token/userId persisted with SecureStore on native; falls back to
// in-memory on web (where SecureStore isn't available).
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN = "tally.token";
const USER = "tally.userId";
const mem: Record<string, string | null> = {};

async function set(k: string, v: string) {
  if (Platform.OS === "web") {
    mem[k] = v;
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(k, v);
}

async function get(k: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return mem[k] ?? globalThis.localStorage?.getItem(k) ?? null;
  }
  return SecureStore.getItemAsync(k);
}

async function del(k: string) {
  if (Platform.OS === "web") {
    mem[k] = null;
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(k);
}

export const session = {
  save: async (token: string, userId: string) => {
    await set(TOKEN, token);
    await set(USER, userId);
  },
  userId: () => get(USER),
  token: () => get(TOKEN),
  clear: async () => {
    await del(TOKEN);
    await del(USER);
  },
};
