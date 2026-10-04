import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { endpoints } from "../../src/api/client";
import type { Match } from "../../src/api/types";
import { removeFromFeeds } from "../../src/features/feed/store";
import { useTheme } from "../../src/theme";
import { Avatar, Button, Empty, ErrorText, Loading } from "../../src/ui/kit";
import { Column } from "../../src/ui/layout";
import { Confirm, Header } from "../../src/ui/Page";
import { Text, fonts } from "../../src/ui/Typography";
const when = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};
export default function Chats() {
  const t = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [remove, setRemove] = useState<Match | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const running = useRef(false);
  const load = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const r = await endpoints.matches();
      if (active.current) {
        setMatches(r.matches);
        setError("");
      }
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Не удалось загрузить");
    } finally {
      running.current = false;
      if (active.current) setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void load();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load();
      }, 8000);
      return () => {
        active.current = false;
        clearInterval(timer);
      };
    }, [load]),
  );
  const unmatch = async () => {
    if (!remove) return;
    setBusy(true);
    try {
      await endpoints.unmatch(remove.id);
      removeFromFeeds(remove.id);
      setRemove(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Чаты" />
      <Column>
        <Text
          style={{
            color: t.text,
            fontFamily: fonts.serif,
            fontSize: 32,
            paddingHorizontal: 16,
            marginVertical: 12,
          }}
        >
          Чаты
        </Text>
        <ErrorText>{error}</ErrorText>
        {!matches ? (
          <Loading />
        ) : !matches.length ? (
          <Empty
            title="Пока нет мэтчей"
            text="Когда вы с кем-то лайкнете друг друга, чат появится здесь."
          />
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(m) => String(m.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
                tintColor={t.accent}
              />
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 18,
                  backgroundColor: t.card,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => router.push(`/chat/${item.id}`)}
                  style={{
                    flexDirection: "row",
                    padding: 14,
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    uri={item.photo}
                    name={item.name}
                    size={52}
                    online={item.online}
                  />
                  <View style={{ flex: 1, gap: 5 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          color: t.text,
                          fontFamily: fonts.serif,
                          fontSize: 21,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ color: t.muted, fontSize: 11 }}>
                        {when(item.last_at)}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: item.unread ? t.text : t.muted,
                        fontSize: 13,
                      }}
                    >
                      {item.last_message || "Напиши первым"}
                    </Text>
                  </View>
                  {!!item.unread && (
                    <Text
                      style={{
                        color: t.accentText,
                        backgroundColor: t.accent,
                        borderRadius: 10,
                        padding: 5,
                        fontSize: 11,
                      }}
                    >
                      {item.unread}
                    </Text>
                  )}
                </Pressable>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    paddingHorizontal: 10,
                    paddingBottom: 8,
                  }}
                >
                  <Button
                    title="Убрать из чатов"
                    kind="ghost"
                    onPress={() => setRemove(item)}
                  />
                </View>
              </View>
            )}
          />
        )}
      </Column>
      {remove && (
        <Confirm
          title="Убрать из чатов?"
          body="Переписка скроется у обоих, анкета уйдёт в дизлайки. Вернуть её можно в архиве своих решений."
          label="Убрать"
          busy={busy}
          onConfirm={() => void unmatch()}
          onClose={() => !busy && setRemove(null)}
        />
      )}
    </View>
  );
}
