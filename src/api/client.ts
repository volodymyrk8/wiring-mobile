import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_URL } from "./config";
import { createApi, type Api, type Hooks } from "./core";
import { filtersQuery, type Filters } from "../filtersCore";
import { clearSession, getToken, setToken } from "./tokens";
import type {
  Catalog,
  FeedPage,
  Match,
  Me,
  Person,
  Photo,
  Thread,
  Archive,
  Session,
} from "./types";

export { ApiError } from "./core";

export const APP_VERSION: string = Constants.expoConfig?.version ?? "0.0.0";

const hooks: Hooks = {};
export const setApiHooks = (next: Hooks) => Object.assign(hooks, next);

/** Absolute URL for a server-relative media path or a photo object. */
export function mediaUrl(value?: Photo | null): string {
  const path = typeof value === "string" ? value : value?.url;
  if (!path) return "";
  return /^https?:\/\//.test(path)
    ? path
    : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const api: Api = createApi({
  baseUrl: API_URL,
  version: APP_VERSION,
  platform: Platform.OS,
  fetchFn: (input, init) => fetch(input, init),
  tokens: {
    get: (key) => getToken(key),
    set: (key, value) => setToken(key, value),
    clear: clearSession,
  },
  hooks,
});

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const endpoints = {
  recommendations: (signal?: AbortSignal) =>
    api<FeedPage>("/api/recommendations", { signal }),
  viewed: (target_id: number) => api("/api/feed/view", json({ target_id })),
  resetFeed: (generation: number) =>
    api<{ reset: boolean; generation: number }>(
      "/api/feed/reset",
      json({ generation }),
    ),
  archive: () => api<Archive>("/api/archive"),
  revise: (
    user_id: number,
    action: "unlike" | "restore" | "unblock" | "unmatch",
  ) => api<Archive>("/api/archive", json({ user_id, action })),
  consents: (special_data_consent: boolean, photo_rights_consent: boolean) =>
    api<{ user: Me }>(
      "/api/me/consents",
      json({ special_data_consent, photo_rights_consent }, "PATCH"),
    ),
  plus: (body: { incognito?: boolean; paused?: boolean }) =>
    api<{ user: Me }>("/api/plus", json(body, "PATCH")),
  redeem: (code: string) =>
    api<{ user: Me }>("/api/premium/redeem", json({ code })),
  recommendationsEnabled: (enabled: boolean) =>
    api<{ user: Me }>("/api/me/jev-feed", json({ enabled })),
  support: (name: string, email: string, body: string) =>
    api<{ notice: string }>("/support", json({ name, email, body })),
  forgot: (email: string) => api("/api/password/forgot", json({ email })),
  resetPassword: (token: string, password: string) =>
    api("/api/password/reset", json({ token, password })),
  resend: (email: string) => api("/api/email/resend", json({ email })),
  verify: (token: string) =>
    api<Session>("/api/email/verify", json({ token, mobile: true })),
  skipOnboard: () => api("/api/onboard/skip", json({})),
  editMessage: (id: number, body: string) =>
    api(`/api/messages/${id}`, json({ body }, "PATCH")),
  deleteMessage: (id: number) =>
    api(`/api/messages/${id}`, { method: "DELETE" }),
  transcribe: (id: number) =>
    api<{ transcript: string }>(`/api/messages/${id}/transcribe`, json({})),
  sendVoice: (
    to_id: number,
    uri: string,
    duration: number,
    reply_to_id?: number,
  ) => {
    const form = new FormData();
    form.append("to_id", String(to_id));
    form.append("duration", String(duration));
    if (reply_to_id) form.append("reply_to_id", String(reply_to_id));
    form.append("file", { uri, name: "voice.m4a", type: "audio/mp4" } as any);
    return api("/api/messages/voice", { method: "POST", body: form });
  },
  inbox: () =>
    api<{
      likes_in: number;
      unread: number;
      notices: { id: number; kind: string; body: string; from_id?: number }[];
    }>("/api/inbox"),
  readNotices: (ids: number[]) => api("/api/notices/read", json({ ids })),
  me: () => api<{ user: Me | null }>("/api/me"),
  token: (email: string, password: string) =>
    api<{ access_token: string; refresh_token: string; user: Me }>(
      "/api/auth/token",
      json({ email, password, device: `${Platform.OS} ${APP_VERSION}` }),
    ),
  register: (b: {
    name: string;
    email: string;
    password: string;
    ref?: string;
  }) =>
    api<{ user?: Me; needs_email_verify?: boolean; email?: string }>(
      "/api/register",
      json({ ...b, age_confirm: true, privacy_confirm: true }),
    ),
  logout: (refresh_token: string | null, push_token: string | null) =>
    api("/api/auth/logout", json({ refresh_token, push_token })),
  catalog: () => api<Catalog>("/api/catalog"),
  feed: (skip: number[] = [], filters?: Filters, signal?: AbortSignal) => {
    const q = [
      filters ? filtersQuery(filters) : "hide_empty=1",
      skip.length ? `skip=${skip.slice(-200).join(",")}` : "",
    ]
      .filter(Boolean)
      .join("&");
    return api<FeedPage>(`/api/feed?limit=2&${q}`, { signal });
  },
  swipe: (target_id: number, direction: "like" | "pass" | "snooze") =>
    api<{ matched: boolean; match: Person | null }>(
      "/api/swipe",
      json({ target_id, direction }),
    ),
  rewind: () =>
    api<{ card: Person | null; undid: string }>("/api/rewind", {
      method: "POST",
    }),
  likes: (filters?: Filters) => {
    const q = filters ? filtersQuery(filters) : "";
    return api<{ likes: Person[]; plus: boolean }>(
      `/api/likes${q ? `?${q}` : ""}`,
    );
  },
  matches: () => api<{ matches: Match[] }>("/api/matches"),
  person: (id: number) =>
    api<{
      person: Person & {
        matched?: boolean;
        liked_you?: boolean;
        you_liked?: boolean;
      };
    }>(`/api/people/${id}`),
  thread: (
    id: number,
    q: { after?: number; before?: number; limit?: number } = {},
  ) => {
    const qs = Object.entries(q)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return api<Thread & { ok: boolean; has_more?: boolean }>(
      `/api/messages/${id}${qs ? `?${qs}` : ""}`,
    );
  },
  send: (
    to_id: number,
    body: string,
    client_id: string,
    reply_to_id?: number,
  ) =>
    api<{ id: number; duplicate?: boolean }>(
      "/api/messages",
      json({ to_id, body, client_id, reply_to_id }),
    ),
  sendPhoto: (
    to_id: number,
    uri: string,
    mime: string,
    name: string,
    reply_to_id?: number,
  ) => {
    const form = new FormData();
    form.append("to_id", String(to_id));
    if (reply_to_id) form.append("reply_to_id", String(reply_to_id));
    form.append("file", { uri, name, type: mime } as any);
    return api("/api/messages/photo", { method: "POST", body: form });
  },
  block: (user_id: number) => api("/api/block", json({ user_id })),
  report: (user_id: number, reason: string, details = "") =>
    api("/api/report", json({ user_id, reason, details })),
  unmatch: (user_id: number) => api("/api/unmatch", json({ user_id })),
  deleteAccount: (password: string) =>
    api("/api/me/delete", json({ password })),
  saveProfile: (body: Record<string, unknown>) =>
    api<{ user: Me }>("/api/me", json(body, "PATCH")),
  setNotifications: (body: { enabled?: boolean; push?: boolean }) =>
    api<{ user: Me }>("/api/notifications", json(body, "PATCH")),
  uploadPhoto: (uri: string, mime: string, name: string) => {
    const form = new FormData();
    form.append("file", { uri, name, type: mime } as any);
    form.append("photo_rights_consent", "1");
    return api<{ photo: { id: number; url: string } }>("/api/photos", {
      method: "POST",
      body: form,
    });
  },
  primaryPhoto: (id: number) =>
    api(`/api/photos/${id}`, json({ is_primary: true }, "PATCH")),
  deletePhoto: (id: number) => api(`/api/photos/${id}`, { method: "DELETE" }),
  registerDevice: (token: string, platform: string) =>
    api("/api/push/device", json({ token, platform })),
  unregisterDevice: (token: string) =>
    api("/api/push/device", json({ token }, "DELETE")),
};

export function mediaSource(value?: Photo | null): {
  uri: string;
  headers: Record<string, string>;
} {
  const token = getToken("access");
  return {
    uri: mediaUrl(value),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}
