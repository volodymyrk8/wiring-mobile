import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { endpoints } from "../api/client";
import { useAuth } from "../auth";
import { Text } from "../ui/Typography";
import { useTheme } from "../theme";
export function Inbox() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const t = useTheme();
  const [notice, setNotice] = useState<{ body: string; path: string } | null>(
    null,
  );
  const seen = useRef(new Set<number>());
  const current = useRef(user);
  useEffect(() => {
    current.current = user;
  }, [user]);
  useEffect(() => {
    if (!current.current) return;
    let alive = true,
      running = false;
    const poll = async () => {
      if (!alive || running || AppState.currentState !== "active") return;
      running = true;
      try {
        const r = await endpoints.inbox();
        if (!alive || !current.current) return;
        setUser({ ...current.current, likes_in: r.likes_in, unread: r.unread });
        const notes = r.notices.filter((n) => !seen.current.has(n.id));
        notes.forEach((n) => seen.current.add(n.id));
        if (notes.length) {
          const n = notes[notes.length - 1];
          if (
            current.current.notify_enabled !== false &&
            path !== `/chat/${n.from_id}`
          )
            setNotice({
              body: n.body,
              path:
                n.kind === "like"
                  ? "/(tabs)/likes"
                  : n.from_id
                    ? `/chat/${n.from_id}`
                    : "/(tabs)/chats",
            });
          await endpoints.readNotices(notes.map((n) => n.id));
        }
      } catch {
      } finally {
        running = false;
      }
    };
    void poll();
    const timer = setInterval(poll, 20000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void poll();
    });
    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [user?.id, path, setUser]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!notice) return null;
  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 90,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 16,
        padding: 14,
        zIndex: 100,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          router.push(notice.path as never);
          setNotice(null);
        }}
      >
        <Text style={{ color: t.text }}>{notice.body}</Text>
      </Pressable>
    </View>
  );
}
