import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import english from "./locales/en.json";
export type Language = "ru" | "en";
const messages: Record<string, string> = english;
let current: Language = "ru";
let pending: Language | null = null;
const listeners = new Set<() => void>();
export const getLanguage = () => current;
export const getLocale = () => current === "en" ? "en-US" : "ru-RU";
export function tr(source: string, ...values: unknown[]): string {
  const key = source.replace(/\s+/g, " ").trim();
  const translated = current === "en" ? messages[key] : undefined;
  const text = translated === undefined ? source : (source.match(/^\s*/)?.[0] || "") + translated + (source.match(/\s*$/)?.[0] || "");
  return text.replace(/\{(\d+)\}/g, (match, index) => Number(index) < values.length ? String(values[Number(index)] ?? "") : match);
}
export async function loadLanguage() {
  try { const value = await AsyncStorage.getItem("wiring-language"); if (value === "ru" || value === "en") current = value; } catch { /* Keep Russian default. */ }
  try { const value = await AsyncStorage.getItem("wiring-language-pending"); if (value === "ru" || value === "en") pending = value; } catch { /* Keep device choice. */ }
  listeners.forEach(listener => listener());
}
export function syncLanguage(value: unknown) {
  if ((value !== "ru" && value !== "en") || value === current) return;
  current = value;
  void AsyncStorage.setItem("wiring-language", value).catch(() => undefined);
  listeners.forEach(listener => listener());
}
export function useLanguage(): Language {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, getLanguage);
}

export const pendingLanguage = () => pending;
export function setPendingLanguage(value: Language | null) {
  pending = value;
  if (value) void AsyncStorage.setItem("wiring-language-pending", value).catch(() => undefined);
  else void AsyncStorage.removeItem("wiring-language-pending").catch(() => undefined);
}
