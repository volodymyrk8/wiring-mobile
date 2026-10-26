import { tr } from "./i18n";
import { api } from "./api/client";
import { themes, type ThemeName } from "./themeTokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

/** Per-device UI preferences. */
export type Prefs = {
  theme: ThemeName;
  likesSort: string;
  themeError?: string;
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

let accountId: number | null = null;
let save = Promise.resolve();
export function syncAccountTheme(user: { id: number; theme?: string | null } | null) {
  accountId = user?.id ?? null;
  if (user?.theme && Object.hasOwn(themes, user.theme)) {
    current = { ...current, theme: user.theme as ThemeName };
    listeners.forEach((l) => l());
    void AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => undefined);
  }
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...current, ...patch, themeError: undefined };
  if (patch.theme && accountId !== null) {
    const owner = accountId;
    save = save.catch(() => undefined).then(async () => {
      if (accountId === owner) await api("/api/me/theme", { method: "PATCH", body: JSON.stringify({ theme: patch.theme }) });
    }).catch(() => { current = { ...current, themeError: tr("Не удалось сохранить тему в аккаунте. Выбери её ещё раз.") }; listeners.forEach((l) => l()); });
  }
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
