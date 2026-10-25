import { tr, useLanguage } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { endpoints } from "../api/client";
import { useAuth } from "../auth";
import { Text } from "../ui/Typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
export function Inbox() {
  useLanguage();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const touch = useRef<{ x: number; y: number } | null>(null);
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
        setUser({ ...current.current, likes_in: r.likes_in, unread: r.unread, unread_chats: r.unread_chats });
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
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!notice) return null;
  return (
    <View
      onTouchStart={(e) => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; }}
      onTouchEnd={(e) => { const start = touch.current; if (start && Math.hypot(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y) > 35) setNotice(null); touch.current = null; }}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: insets.top + 64,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 16,
        padding: 14,
        zIndex: 100,
      }}
    >
      <Pressable accessibilityLabel={tr("Закрыть уведомление")} onPress={() => setNotice(null)} style={{ alignSelf: "flex-end", padding: 6 }}><Text style={{ color: t.text }}>×</Text></Pressable>
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
