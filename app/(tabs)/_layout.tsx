import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth";
import { useTheme } from "../../src/theme";
import { fonts } from "../../src/ui/Typography";
export default function TabsLayout() {
  const t = useTheme();
  const { user } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: t.accent, color: t.accentText },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Лента",
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: "Лайки",
          tabBarBadge: user?.likes_in || undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Чаты",
          tabBarBadge: user?.unread || undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="for-you"
        options={{
          title: "Для тебя",
          href:
            user?.jev_feed_unlocked && user?.jev_feed_enabled
              ? undefined
              : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" color={color} size={23} />
          ),
        }}
      />
    </Tabs>
  );
}
