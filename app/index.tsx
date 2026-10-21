import { useRouter } from "expo-router";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useAuth } from "../src/auth";
import { useTheme } from "../src/theme";
import { Button } from "../src/ui/kit";
import { Page } from "../src/ui/Page";
import { Text, fonts } from "../src/ui/Typography";
export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const { width } = useWindowDimensions();
  const body = { color: t.text, fontSize: 14.5, lineHeight: 22 } as const;
  const frame = {
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  } as const;
  return (
    <Page title="" back={false}>
      <View style={{ paddingVertical: 20, alignItems: "center", gap: 6 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.serif,
            fontSize: Math.min(28, Math.max(22, width * 0.052)),
            letterSpacing: -0.6,
            lineHeight: 32,
            color: t.text,
            textAlign: "center",
          }}
        >
          <Text style={{ color: t.accent, fontFamily: fonts.serifBold }}>
            Отличные
          </Text>{" "}
          люди рядом
        </Text>
        <Text
          style={{
            color: t.muted,
            fontFamily: fonts.medium,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Знакомства для нейроотличных
        </Text>
      </View>
      <Button
        title={user ? "Показать ленту" : "Создать профиль"}
        onPress={() => router.push(user ? "/(tabs)/feed" : "/register")}
      />
      {!user && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            marginVertical: 10,
          }}
        >
          <Text style={{ color: t.muted, fontSize: 15 }}>
            Уже есть профиль?
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/login")}
          >
            <Text
              style={{ color: t.text, fontFamily: fonts.bold, fontSize: 15 }}
            >
              Войти
            </Text>
          </Pressable>
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        <View style={frame}>
          <Text style={body}>
            Мы нейроотличные люди и делаем проект для таких же, как мы. Создаём
            пространство для свободного и комфортного общения.
          </Text>
          <Text style={{ color: t.muted, fontSize: 12.5, lineHeight: 19 }}>
            <Text style={{ fontFamily: fonts.bold }}>Бета-версия.</Text>{" "}
            Сообщайте в{" "}
            <Text
              accessibilityRole="link"
              onPress={() => router.push("/support")}
              style={{ color: t.text, textDecorationLine: "underline" }}
            >
              поддержку
            </Text>{" "}
            о любых замечаниях, пожеланиях и улучшениях — мы внимательно и
            оперативно обработаем и при необходимости дадим обратную связь.
          </Text>
        </View>
        <View style={frame}>
          <Text style={body}>
            <Text style={{ color: t.accent, fontFamily: fonts.bold }}>
              WIRING+ на 3 месяца.
            </Text>{" "}
            Каждому аккаунту — и тем, кто уже с нами, и всем, кто только
            регистрируется. Спасибо, что помогаете тестировать бета.
          </Text>
          {user && (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/plus")}
            >
              <Text
                style={{
                  color: t.text,
                  textDecorationLine: "underline",
                  fontFamily: fonts.bold,
                  fontSize: 13,
                }}
              >
                Посмотреть в профиле
              </Text>
            </Pressable>
          )}
        </View>
        <Text
          style={{
            textAlign: "center",
            color: t.muted,
            fontFamily: fonts.serif,
            fontSize: 24,
            marginVertical: 20,
          }}
        >
          Можно быть собой.
        </Text>
      </View>
    </Page>
  );
}
