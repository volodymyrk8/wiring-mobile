import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { ProductNav } from "./ProductNav";
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { setPrefs, usePrefs } from "../prefs";
import { THEME_LIST, themes, useTheme } from "../theme";
import { Avatar, Button, Row } from "./kit";
import { Text, fonts } from "./Typography";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const t = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <NativeModal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: t.glass,
          justifyContent: "center",
          padding: 20,
          paddingTop: inset.top + 20,
          paddingBottom: inset.bottom + 20,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: "90%",
            width: "100%",
            maxWidth: 540,
            alignSelf: "center",
            backgroundColor: t.card,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                flex: 1,
                fontFamily: fonts.serif,
                color: t.text,
                fontSize: 24,
              }}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={onClose}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color={t.text} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </NativeModal>
  );
}
export function Confirm({
  title,
  body,
  label = "Подтвердить",
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  label?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  return (
    <Modal title={title} onClose={onClose}>
      <Text style={{ color: t.muted, lineHeight: 22, marginBottom: 18 }}>
        {body}
      </Text>
      <Button title={label} busy={busy} onPress={onConfirm} />
      <View style={{ height: 8 }} />
      <Button title="Отмена" kind="ghost" disabled={busy} onPress={onClose} />
    </Modal>
  );
}
export function Header({
  title,
  right,
  back = false,
  compact = false,
}: {
  title?: string;
  right?: ReactNode;
  back?: boolean;
  compact?: boolean;
}) {
  const t = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const prefs = usePrefs();
  const [menu, setMenu] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const go = (path: string) => {
    setMenu(false);
    router.push(path as never);
  };
  return (
    <View
      style={{
        paddingTop: inset.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: t.bg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 44,
        }}
      >
        {!compact && back && (
          <Pressable
            accessibilityLabel="Назад"
            accessibilityRole="button"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={{ padding: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={t.text} />
          </Pressable>
        )}
        {!compact && <Pressable
          accessibilityLabel="WIRING — главная"
          onPress={() => router.push("/")}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontFamily: fonts.brand, fontSize: 23, color: t.text, letterSpacing: 0.3 }}>WIRING{!title && <Text style={{ fontSize: 10, color: t.muted }}> beta</Text>}</Text>
            {!!title && <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 13 }}>/ {title.toLowerCase()}</Text>}
          </View>
        </Pressable>}
        {!compact && right}
        <Pressable
          accessibilityLabel={`Тема: ${THEME_LIST.find((i) => i.id === prefs.theme)?.label}`}
          onPress={() => setThemeMenu(true)}
          style={{
            marginRight: compact ? "auto" : undefined,
            height: 40,
            width: 40,
            borderRadius: 20,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={t.isDark ? "moon-outline" : "sunny-outline"} size={20} color={t.text} />
        </Pressable>
        {compact && right}
        {!compact && <Pressable
          accessibilityLabel={user ? "Меню профиля" : "Войти"}
          onPress={() => (user ? setMenu(true) : router.push("/login"))}
        >
          <Avatar uri={user?.photo} name={user?.name} size={40} />
        </Pressable>}
      </View>
      {themeMenu && (
        <Modal title="Оформление" onClose={() => setThemeMenu(false)}>
          {THEME_LIST.map((i) => (
            <Row
              key={i.id}
              icon="ellipse"
              title={i.label}
              onPress={() => {
                setPrefs({ theme: i.id });
                setThemeMenu(false);
              }}
              right={
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: themes[i.id].bg,
                    borderWidth: prefs.theme === i.id ? 3 : 1,
                    borderColor: themes[i.id].accent,
                  }}
                />
              }
            />
          ))}
        </Modal>
      )}
      {menu && (
        <Modal title={user?.name || "Профиль"} onClose={() => setMenu(false)}>
          <Row
            icon="person-outline"
            title="Редактировать анкету"
            onPress={() => go("/edit-profile")}
          />
          <Row
            icon="shield-checkmark-outline"
            title="Согласия"
            onPress={() => go("/consents")}
          />
          <Row
            icon="diamond-outline"
            title="WIRING+"
            onPress={() => go("/plus")}
          />
          <Row
            icon="notifications-outline"
            title="Уведомления"
            onPress={() => go("/notifications")}
          />
          <Row
            icon="people-outline"
            title="Пригласи своих"
            onPress={() => go("/invite")}
          />
          <Row
            icon="help-buoy-outline"
            title="Поддержка"
            onPress={() => go("/support")}
          />
          <Row
            icon="log-out-outline"
            title="Выйти"
            onPress={() => {
              setMenu(false);
              void logout().then(() => router.replace("/"));
            }}
          />
        </Modal>
      )}
    </View>
  );
}
export function LegalFooter() {
  const t = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 14,
        paddingVertical: 24,
        borderTopWidth: 1,
        borderColor: t.border,
        marginTop: 18,
      }}
    >
      <Text style={{ fontSize: 12, color: t.muted }}>18+</Text>
      {[
        ["соглашение", "/rules"],
        ["конфиденциальность", "/privacy"],
        ["рассылка", "/marketing"],
        ["Защита детей", "/child-safety"],
        ["Удаление аккаунта и данных", "/account-deletion"],
        ["поддержка", "/support"],
      ].map(([label, path]) => (
        <Pressable
          key={path}
          accessibilityRole="link"
          onPress={() => router.push(path as never)}
        >
          <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Page({
  title,
  children,
  back = true,
  footer = true,
}: {
  title: string;
  children: ReactNode;
  back?: boolean;
  footer?: boolean;
}) {
  const t = useTheme();
  const inset = useSafeAreaInsets();
  const segments = useSegments();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title={title} back={back} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: "100%",
          maxWidth: 540,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingBottom: inset.bottom + 24,
        }}
      >
        {children}
        {footer && <LegalFooter />}
      </ScrollView>
      {segments[0] !== "(tabs)" && <ProductNav />}
    </KeyboardAvoidingView>
  );
}
export function Title({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fonts.serif,
        color: t.text,
        fontSize: 32,
        marginTop: 8,
        marginBottom: 14,
        letterSpacing: -0.8,
      }}
    >
      {children}
    </Text>
  );
}
export function Hint({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text
      style={{ color: t.muted, fontSize: 14, lineHeight: 21, marginBottom: 14 }}
    >
      {children}
    </Text>
  );
}
export function Check({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={24}
        color={checked ? t.accent : t.muted}
      />
      <Text style={{ flex: 1, color: t.text, fontSize: 14, lineHeight: 20 }}>
        {label}
      </Text>
    </Pressable>
  );
}
