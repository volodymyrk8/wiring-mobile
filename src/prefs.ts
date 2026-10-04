import { themes, type ThemeName } from "./themeTokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

/** Per-device UI preferences. */
export type Prefs = {
  theme: ThemeName;
  likesSort: string;
};

const KEY = "wiring.prefs.v1";
let current: Prefs = {
  theme: "mist",
  likesSort: "newest",
};
const listeners = new Set<() => void>();

export async function loadPrefs(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) current = { ...current, ...JSON.parse(raw) };
    if (!Object.hasOwn(themes, current.theme)) current.theme = "mist";
    listeners.forEach((l) => l());
  } catch {
    // defaults
  }
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => undefined);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}
