import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { useTheme } from "../theme";
import { Text } from "./Typography";

/** The site's participant navigation, shared by tabs and standalone pages. */
export function ProductNav() {
  const t = useTheme();
  const { user } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const items: { label: string; route: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; badge?: number }[] = [
    { label: "Главная", route: user ? "/(tabs)/home" : "/", icon: "home-outline", active: path === "/" || path === "/home" },
    { label: "Лента", route: "/(tabs)/feed", icon: "albums-outline", active: path === "/feed" },
    { label: "Лайки", route: "/(tabs)/likes", icon: "heart-outline", active: path === "/likes", badge: user?.likes_in },
    { label: "Чаты", route: "/(tabs)/chats", icon: "chatbubbles-outline", active: path === "/chats", badge: user?.unread },
  ];
  if (user?.jev_feed_unlocked && user?.jev_feed_enabled) items.push({ label: "Для тебя", route: "/(tabs)/for-you", icon: "sparkles-outline", active: path === "/for-you" });
  items.push({ label: user ? "Профиль" : "Войти", route: user ? "/(tabs)/profile" : "/login", icon: "person-circle-outline", active: path === "/profile" || path === `/person/${user?.id}` || path === "/login" });
  return <View style={{ backgroundColor: t.bg, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(inset.bottom, 12) }}>
    <View accessibilityRole="tablist" style={{ flexDirection: "row", padding: 5, borderRadius: 24, borderWidth: 1, borderColor: t.border, backgroundColor: t.card }}>
      {items.map(item => <Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.active }} onPress={() => router.navigate(item.route as never)} style={{ flex: 1, alignItems: "center", paddingVertical: 5, borderRadius: 18, backgroundColor: item.active ? t.chip : "transparent", gap: 3 }}>
        <Ionicons name={item.icon} color={item.active ? t.text : t.muted} size={20} />
        {!!item.badge && <Text style={{ position: "absolute", right: 7, top: 0, backgroundColor: t.danger, color: t.onPhoto, borderRadius: 8, paddingHorizontal: 4, fontSize: 10 }}>{item.badge}</Text>}
        <Text style={{ fontSize: 10, color: item.active ? t.text : t.muted }}>{item.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
