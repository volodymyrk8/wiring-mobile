import { hasPendingDestination, consumeDestination } from "../src/routes";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import {
  Fraunces_500Medium,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { Inbox } from "../src/features/inbox";
import { AuthProvider, useAuth } from "../src/auth";
import { routeForPush } from "../src/push";
import { useTheme } from "../src/theme";
import { Button, Empty, Loading } from "../src/ui/kit";
import { Linking, View } from "react-native";
import { API_URL } from "../src/api/config";

function Gate() {
  const [fontsReady, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });
  const { user, loading, upgradeRequired } = useAuth();
  const t = useTheme();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (loading) return;
    if (!user && hasPendingDestination() && path !== "/login")
      router.replace("/login");
    else if (user && hasPendingDestination())
      router.replace(consumeDestination() as never);
  }, [loading, user, path, router]);
  useEffect(() => {
    if (
      !loading &&
      user?.needs_profile &&
      ["/feed", "/likes", "/chats", "/for-you"].includes(path)
    )
      router.replace("/edit-profile");
  }, [loading, user?.needs_profile, path, router]);

  useEffect(() => {
    if (!user) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const target = routeForPush(
        response?.notification.request.content.data?.url as string | undefined,
      );
      if (target) router.push(target as any);
    };
    Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [user, router]);

  if (loading || (!fontsReady && !fontError)) return <Loading />;
  if (upgradeRequired) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <Empty
          icon="cloud-download-outline"
          title="Нужно обновление"
          text={`Эта версия WIRING больше не поддерживается. Установи версию ${upgradeRequired} или новее.`}
          action={
            <Button
              title="Открыть сайт"
              onPress={() => Linking.openURL(API_URL)}
            />
          }
        />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={t.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: "Назад",
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: "Чат" }} />
          <Stack.Screen name="person/[id]" options={{ title: "Профиль" }} />
          <Stack.Screen name="edit-profile" options={{ title: "Моя анкета" }} />
          <Stack.Screen name="visibility" />
          <Stack.Screen name="consents" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="plus" />
          <Stack.Screen name="archive" />
          <Stack.Screen name="delete-account" />
          <Stack.Screen name="onboard" />
        </Stack.Protected>
        <Stack.Screen name="index" />
        <Stack.Screen name="support" />
        <Stack.Screen name="rules" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="child-safety" />
        <Stack.Screen name="account-deletion" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="reset" />
        <Stack.Screen name="verify" />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Регистрация" }} />
        </Stack.Protected>
      </Stack>
      <Inbox />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
