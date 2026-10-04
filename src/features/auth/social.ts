import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { api } from "../../api/client";
import type { Session } from "../../api/types";

WebBrowser.maybeCompleteAuthSession();
export async function socialLogin(
  provider: string,
  mode: "login" | "register",
  ref?: string,
): Promise<Session | null> {
  const verifier = Array.from(await Crypto.getRandomBytesAsync(32), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const challenge = digest
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const state = Crypto.randomUUID();
  const start = await api<{ url: string }>(`/api/auth/${provider}/start`, {
    method: "POST",
    body: JSON.stringify({
      mode,
      ref,
      age_confirm: true,
      privacy_confirm: true,
      native: true,
      code_challenge: challenge,
      native_state: state,
    }),
  });
  const response = await WebBrowser.openAuthSessionAsync(
    start.url,
    "wiring://oauth",
  );
  if (response.type !== "success") return null;
  const url = new URL(response.url);
  if (
    url.protocol !== "wiring:" ||
    url.hostname !== "oauth" ||
    url.searchParams.get("state") !== state
  )
    throw new Error("Не удалось проверить ответ входа. Попробуй снова.");
  if (url.searchParams.has("error"))
    throw new Error(url.searchParams.get("error") || "Вход отменён");
  const code = url.searchParams.get("code");
  if (!code) throw new Error("Сервис входа не передал подтверждение");
  return api<Session>("/api/auth/native/exchange", {
    method: "POST",
    body: JSON.stringify({ code, code_verifier: verifier }),
  });
}
