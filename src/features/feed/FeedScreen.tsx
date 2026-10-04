import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, View, type ViewToken } from "react-native";
import { endpoints } from "../../api/client";
import type { Person } from "../../api/types";
import { useAuth } from "../../auth";
import {
  getFilters,
  setFilters,
  useFilters,
  type Filters,
} from "../../filters";
import { useTheme } from "../../theme";
import { FilterButton, FiltersSheet } from "../../ui/FiltersSheet";
import { Button, Empty, ErrorText } from "../../ui/kit";
import { Header, Confirm, Hint } from "../../ui/Page";
import { Text } from "../../ui/Typography";
import { MatchModal } from "../../ui/MatchModal";
import { useLayout } from "../../ui/layout";
import { appendFeed, initialFeed } from "./state";
import { getFeed, setFeed, useFeed, removeFromFeeds } from "./store";
import { ActionCircle, ProfileCard } from "./ProfileCard";
export function FeedScreen({
  recommendations = false,
}: {
  recommendations?: boolean;
}) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const { contentWidth } = useLayout();
  const filters = useFilters();
  const key = `${user?.id}:${recommendations ? "recommendations" : JSON.stringify(filters)}`;
  const state = useFeed(key);
  const [height, setHeight] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"pass" | "reset" | null>(null);
  const [match, setMatch] = useState<Person | null>(null);
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const list = useRef<FlatList<Person>>(null);
  const viewed = useRef(new Set<number>());
  const loadingKey = useRef("");
  const load = useCallback(async () => {
    if (loadingKey.current === key) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    loadingKey.current = key;
    setLoading(true);
    try {
      const current = getFeed(key);
      const page = recommendations
        ? await endpoints.recommendations(controller.signal)
        : await endpoints.feed(
            current.cards.map((c) => c.id),
            getFilters(),
            controller.signal,
          );
      if (!controller.signal.aborted) {
        setFeed(key, appendFeed(getFeed(key), page));
        setError("");
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Не удалось загрузить");
    } finally {
      if (!controller.signal.aborted) {
        loadingKey.current = "";
        setLoading(false);
      }
    }
  }, [key, recommendations]);
  useEffect(() => {
    active.current = true;
    if (!getFeed(key).cards.length)
      queueMicrotask(() => {
        if (active.current) void load();
      });
    return () => {
      active.current = false;
      request.current?.abort();
      loadingKey.current = "";
    };
  }, [key, load]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      if (recommendations) {
        setFeed(key, initialFeed());
        void load();
      } else if (!getFeed(key).cards.length || getFeed(key).hasMore) {
        void load();
      }
      return () => {
        active.current = false;
        request.current?.abort();
        loadingKey.current = "";
      };
    }, [recommendations, key, load]),
  );
  const previousCount = useRef(state.cards.length);
  useEffect(() => {
    if (state.cards.length < previousCount.current)
      list.current?.scrollToOffset({
        offset: state.index * height,
        animated: false,
      });
    previousCount.current = state.cards.length;
  }, [state.cards.length, state.index, height]);
  const current = state.cards[state.index];
  useEffect(() => {
    if (current && !recommendations && !viewed.current.has(current.id)) {
      viewed.current.add(current.id);
      void endpoints
        .viewed(current.id)
        .catch(() => viewed.current.delete(current.id));
    }
    if (
      current &&
      state.hasMore &&
      state.cards.length - state.index <= 2 &&
      !loading &&
      !error
    )
      queueMicrotask(() => {
        if (active.current) void load();
      });
  }, [
    current,
    state.hasMore,
    state.index,
    state.cards.length,
    load,
    loading,
    recommendations,
    error,
  ]);
  const action = async (dir: "like" | "pass") => {
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await endpoints.swipe(current.id, dir);
      removeFromFeeds(current.id);
      setConfirm(null);
      if (result.matched) setMatch(result.match || current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const reset = async () => {
    if (busy) return;
    setBusy(true);
    try {
      request.current?.abort();
      loadingKey.current = "";
      const result = await endpoints.resetFeed(state.generation);
      setFeed(key, { ...initialFeed(), generation: result.generation });
      viewed.current.clear();
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось повторить");
    } finally {
      setBusy(false);
    }
  };
  const visible = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Person>[] }) => {
      const i = viewableItems[0]?.index;
      if (i !== null && i !== undefined)
        setFeed(key, { ...getFeed(key), index: i });
    },
    [key],
  );
  if (recommendations && !(user?.jev_feed_unlocked && user?.jev_feed_enabled))
    return <Redirect href="/edit-profile" />;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header
        compact={!recommendations}
        title={recommendations ? "Для тебя" : "Лента"}
        right={
          !recommendations ? (
            <FilterButton
              filters={filters}
              onPress={() => setFiltersOpen(true)}
            />
          ) : undefined
        }
      />
      {user?.paused && (
        <View style={{ paddingHorizontal: 16 }}>
          <Hint>
            Анкета на паузе: тебя не показывают в ленте, чаты сохраняются.
          </Hint>
          <Button
            title="Снять паузу"
            kind="ghost"
            onPress={() =>
              void endpoints
                .plus({ paused: false })
                .then((r) => setUser(r.user))
                .catch((e) => setError(e.message))
            }
          />
        </View>
      )}
      {recommendations && (
        <Text
          style={{
            color: t.muted,
            fontSize: 12,
            paddingHorizontal: 16,
            paddingBottom: 6,
          }}
        >
          {state.source === "local"
            ? "Jev сейчас недоступен: порядок по совпадениям анкет"
            : "Jev ранжирует предварительный список"}
        </Text>
      )}
      <ErrorText>{error}</ErrorText>
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      >
        {state.cards.length ? (
          <FlatList
            ref={list}
            key={key}
            data={state.cards}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            keyExtractor={(p) => String(p.id)}
            initialScrollIndex={state.index}
            getItemLayout={(_, i) => ({
              length: height,
              offset: height * i,
              index: i,
            })}
            onViewableItemsChanged={visible}
            viewabilityConfig={{ itemVisiblePercentThreshold: 65 }}
            renderItem={({ item }) => (
              <View
                style={{
                  height,
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <ProfileCard
                  person={item}
                  width={contentWidth - 20}
                  height={height - (recommendations ? 85 : 8)}
                />
                {recommendations && (
                  <View
                    style={{
                      width: "100%",
                      maxWidth: 508,
                      paddingHorizontal: 12,
                      paddingTop: 8,
                    }}
                  >
                    <Text
                      style={{ color: t.text, fontSize: 12, fontWeight: "600" }}
                    >
                      Почему может подойти
                    </Text>
                    {item.recommendation_reasons?.map((reason) => (
                      <Text
                        key={reason}
                        style={{ color: t.muted, fontSize: 12 }}
                      >
                        • {reason}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <Empty
            title={loading ? "Ищем новые анкеты…" : "Новых анкет пока нет"}
            text={
              recommendations
                ? "Подходящих анкет сейчас нет. Обнови подбор позже."
                : "Загляни позже."
            }
            action={
              <View style={{ gap: 10 }}>
                <Button
                  title="Проверить новые"
                  kind="ghost"
                  busy={loading}
                  onPress={() => void load()}
                />
                {!recommendations && (
                  <>
                    <Button
                      title="Показать анкеты ещё раз"
                      disabled={!user?.plus || loading}
                      onPress={() => setConfirm("reset")}
                    />
                    {!user?.plus && (
                      <Hint>Повторный показ доступен с WIRING+.</Hint>
                    )}
                  </>
                )}
              </View>
            }
          />
        )}
      </View>
      {current && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 18,
            paddingVertical: 10,
          }}
        >
          <ActionCircle
            label="Скрыть"
            disabled={busy}
            onPress={() => setConfirm("pass")}
          >
            <Ionicons name="close" size={20} color={t.muted} />
          </ActionCircle>
          <ActionCircle
            label="Профиль"
            onPress={() => router.push(`/person/${current.id}`)}
          >
            <Ionicons name="person-outline" size={20} color={t.text} />
          </ActionCircle>
          <ActionCircle
            label="Лайк"
            disabled={busy}
            onPress={() => void action("like")}
          >
            <Ionicons name="heart-outline" size={20} color={t.accent} />
          </ActionCircle>
        </View>
      )}
      {filtersOpen && (
        <FiltersSheet
          value={filters}
          onApply={(f: Filters) => {
            setFilters(f);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
      {confirm && (
        <Confirm
          title={
            confirm === "pass" ? "Скрыть анкету?" : "Показать анкеты ещё раз?"
          }
          body={
            confirm === "pass"
              ? "Анкета больше не появится в ленте. Вернуть её можно в архиве своих решений."
              : "Ранее показанные анкеты снова появятся в ленте. Исключённые анкеты не вернутся; лайки и чаты сохранятся."
          }
          label={confirm === "pass" ? "Скрыть" : "Показать ещё раз"}
          busy={busy}
          onConfirm={() => void (confirm === "pass" ? action("pass") : reset())}
          onClose={() => !busy && setConfirm(null)}
        />
      )}
      <MatchModal
        person={match}
        onClose={() => setMatch(null)}
        onWrite={() => {
          if (match) router.push(`/chat/${match.id}`);
          setMatch(null);
        }}
      />
    </View>
  );
}
