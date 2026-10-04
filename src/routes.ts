/** Canonical site links map to the same native screens, including email/referral links. */
export function nativeRoute(path: string): string {
  try {
    const url = new URL(path, "https://wiring.date");
    if (
      url.protocol !== "wiring:" &&
      !["wiring.date", "wiring.club", "localhost", "127.0.0.1"].includes(
        url.hostname,
      )
    )
      return "/";
    let pathname =
      url.protocol === "wiring:"
        ? `/${url.hostname}${url.pathname}`
        : url.pathname;
    if (url.searchParams.has("verify")) {
      pathname = "/verify";
      url.searchParams.set("token", url.searchParams.get("verify")!);
      url.searchParams.delete("verify");
    }
    if (url.searchParams.has("reset")) {
      pathname = "/reset";
      url.searchParams.set("token", url.searchParams.get("reset")!);
      url.searchParams.delete("reset");
    }
    const alias: Record<string, string> = {
      "/sign-in": "/login",
      "/sign-up": "/register",
      "/me": "/edit-profile",
      "/feed": "/(tabs)/feed",
      "/likes": "/(tabs)/likes",
      "/chats": "/(tabs)/chats",
      "/for-you": "/(tabs)/for-you",
    };
    const person = pathname.match(/^\/p\/(\d+)$/),
      chat = pathname.match(/^\/chats\/(\d+)$/),
      ref = pathname.match(/^\/r\/([^/]+)$/);
    pathname = person
      ? `/person/${person[1]}`
      : chat
        ? `/chat/${chat[1]}`
        : alias[pathname] || pathname;
    if (ref) {
      pathname = "/register";
      url.searchParams.set("ref", decodeURIComponent(ref[1]));
    }
    const safe =
      /^\/(?:$|\(tabs\)\/(?:feed|likes|chats|profile|for-you)$|(?:person|chat)\/\d+$|login$|register$|forgot$|reset$|verify$|onboard$|archive$|consents$|notifications$|plus$|invite$|marketing$|glossary$|support$|rules$|privacy$|child-safety$|account-deletion$|edit-profile$|visibility$|delete-account$|oauth$)/;
    if (!safe.test(pathname)) return "/";
    return pathname + (url.search ? url.search : "");
  } catch {
    return "/";
  }
}

let pendingDestination: string | null = null;
export function rememberDestination(path: string) {
  if (
    /^\/(?:\(tabs\)\/|person\/|chat\/|edit-profile$|archive$|notifications$|consents$|plus$|invite$|delete-account$|onboard$|visibility$)/.test(
      path,
    )
  )
    pendingDestination = path;
}
export const hasPendingDestination = () => pendingDestination !== null;
export function consumeDestination() {
  const route = pendingDestination;
  pendingDestination = null;
  return route;
}
