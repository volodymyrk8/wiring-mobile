import { clearFeeds } from "./features/feed/store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { endpoints, setApiHooks } from "./api/client";
import { clearSession, getToken, loadTokens, setToken } from "./api/tokens";
import type { Me, Session } from "./api/types";
import { loadFilters } from "./filters";
import { loadPrefs } from "./prefs";
import { unregisterPush } from "./push";

type AuthState = {
  user: Me | null;
  loading: boolean;
  upgradeRequired: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    ref?: string,
  ) => Promise<{ needsEmailVerify: boolean; email: string }>;
  acceptSession: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: Me) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setUser((await endpoints.me()).user);
    } catch {
      // Network errors keep the current user; a lost session is handled by the api hook.
    }
  }, []);

  useEffect(() => {
    setApiHooks({
      onSessionLost: () => {
        clearFeeds();
        setUser(null);
      },
      onUpgradeRequired: (min) => setUpgradeRequired(min || "новой версии"),
    });
    (async () => {
      await Promise.all([loadTokens(), loadFilters(), loadPrefs()]);
      if (getToken("access") || getToken("refresh")) await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const acceptSession = useCallback(async (res: Session) => {
    clearFeeds();
    await setToken("access", res.access_token);
    await setToken("refresh", res.refresh_token);
    setUser(res.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) =>
      acceptSession(await endpoints.token(email.trim(), password)),
    [acceptSession],
  );

  // Profile/notification PATCH responses omit inbox counters; keep the last known ones so the
  // tab badges do not blink to zero until the next /api/me refresh.
  const mergeUser = useCallback((next: Me) => {
    setUser((prev) => ({
      ...next,
      unread: next.unread ?? prev?.unread,
      likes_in: next.likes_in ?? prev?.likes_in,
    }));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      upgradeRequired,
      refresh,
      setUser: mergeUser,
      login: signIn,
      acceptSession,
      register: async (name, email, password, ref) => {
        const res = await endpoints.register({
          name: name.trim(),
          email: email.trim(),
          password,
          ref,
        });
        if (!res.needs_email_verify) await signIn(email, password);
        return {
          needsEmailVerify: !!res.needs_email_verify,
          email: res.email || email.trim(),
        };
      },
      logout: async () => {
        const refreshToken = getToken("refresh");
        const push = await unregisterPush().catch(() => null);
        try {
          await endpoints.logout(refreshToken, push);
        } catch {
          // Tokens are dropped locally either way.
        }
        await clearSession();
        clearFeeds();
        setUser(null);
      },
    }),
    [user, loading, upgradeRequired, refresh, signIn, mergeUser, acceptSession],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
