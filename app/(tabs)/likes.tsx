import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { endpoints, mediaSource } from "../../src/api/client";
import type { Person } from "../../src/api/types";
import { useCatalog } from "../../src/catalog";
import { useAuth } from "../../src/auth";
import { defaultFilters, type Filters } from "../../src/filtersCore";
import {
  LIKES_SORT_OPTIONS,
  sortLikeCards,
  type LikesSort,
} from "../../src/features/likes/sort";
import { setPrefs, usePrefs } from "../../src/prefs";
import { useTheme } from "../../src/theme";
import { FilterButton, FiltersSheet } from "../../src/ui/FiltersSheet";
import {
  Button,
  Card,
  Chip,
  Empty,
  ErrorText,
  Field,
  Loading,
} from "../../src/ui/kit";
import { Page, Title, Hint, Modal } from "../../src/ui/Page";
import { Text, fonts } from "../../src/ui/Typography";
export default function Likes() {
  const t = useTheme();
  const router = useRouter();
  const catalog = useCatalog();
  const { setUser } = useAuth();
  const prefs = usePrefs();
  const [likes, setLikes] = useState<Person[] | null>(null);
  const [plus, setPlus] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters(),
    hide_undiagnosed: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const active = useRef(false);
  const load = useCallback(async () => {
    try {
      const r = await endpoints.likes(filters);
      if (active.current) {
        setLikes(r.likes);
        setPlus(r.plus);
        setError("");
      }
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Не удалось загрузить");
    }
  }, [filters]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void load();
      return () => {
        active.current = false;
      };
    }, [load]),
  );
  const sorted = useMemo(
    () => sortLikeCards(likes || [], prefs.likesSort as LikesSort),
    [likes, prefs.likesSort],
  );
  const redeem = async () => {
    setBusy(true);
    try {
      const r = await endpoints.redeem(code);
      setUser(r.user);
      setCode("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось применить код");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Лайки" back={false}>
      <Title>Тебя лайкнули</Title>
      <Hint>Здесь люди, которым понравилась твоя анкета.</Hint>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <FilterButton filters={filters} onPress={() => setFiltersOpen(true)} />
        <Button
          title="Сортировка"
          kind="ghost"
          onPress={() => setSortOpen(true)}
        />
        <Button title="Обновить" kind="ghost" onPress={() => void load()} />
      </View>
      <ErrorText>{error}</ErrorText>
      {!likes ? (
        <Loading />
      ) : !likes.length ? (
        <Empty
          title="Пока нет лайков"
          text="Заполни анкету и загляни в ленту. Если включены фильтры, попробуй их сбросить."
        />
      ) : (
        <>
          {!plus && (
            <Card style={{ marginBottom: 14 }}>
              <Text
                style={{ color: t.text, fontFamily: fonts.serif, fontSize: 24 }}
              >
                Открой симпатии с WIRING+
              </Text>
              <Hint>
                Фото и анкеты тех, кто тебя лайкнул, доступны с подпиской.
              </Hint>
              <Field label="Промокод" value={code} onChangeText={setCode} />
              <Button
                title="Применить"
                busy={busy}
                disabled={!code.trim()}
                onPress={() => void redeem()}
              />
              <Button
                title="О WIRING+"
                kind="ghost"
                onPress={() => router.push("/plus")}
              />
            </Card>
          )}
          {sorted.map((p, i) => (
            <Pressable
              key={p.hidden ? `hidden-${i}` : p.id}
              onPress={() =>
                router.push(p.hidden ? "/plus" : `/person/${p.id}`)
              }
              style={{
                flexDirection: "row",
                marginBottom: 12,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.card,
              }}
            >
              {p.hidden ? (
                <View
                  style={{
                    width: 112,
                    minHeight: 150,
                    backgroundColor: t.chip,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 26 }}>🔒</Text>
                </View>
              ) : (
                <Image
                  source={mediaSource(p.photo || p.photos?.[0])}
                  style={{ width: 112, minHeight: 150 }}
                  contentFit="cover"
                />
              )}
              <View style={{ flex: 1, padding: 14, gap: 5 }}>
                <Text
                  style={{
                    color: t.text,
                    fontFamily: fonts.serif,
                    fontSize: 21,
                  }}
                >
                  {p.hidden
                    ? "Новая симпатия"
                    : `${p.name}${p.age ? `, ${p.age}` : ""}`}
                </Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {p.hidden
                    ? "Этот человек лайкнул твою анкету"
                    : [
                        p.city,
                        (p.intents || [])
                          .map(
                            (id) =>
                              catalog?.intents?.find((v) => v.id === id)
                                ?.label || id,
                          )
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </Text>
                {!p.hidden && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {[...(p.neuro || []).slice(0, 2), ...(p.vibe || [])].map(
                      (id) => (
                        <Text
                          key={id}
                          style={{
                            color: t.text,
                            fontSize: 10,
                            backgroundColor: t.chip,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            margin: 2,
                          }}
                        >
                          {[
                            ...(catalog?.neuro || []),
                            ...(catalog?.vibe || []),
                          ].find((v) => v.id === id)?.label || id}
                        </Text>
                      ),
                    )}
                  </View>
                )}
                <Text
                  numberOfLines={2}
                  style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}
                >
                  {p.hidden
                    ? "Фото и анкета доступны с подпиской WIRING+"
                    : p.bio || p.communication}
                </Text>
                <Text
                  style={{
                    color: t.text,
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 5,
                  }}
                >
                  {p.hidden ? "Открыть с WIRING+ →" : "Смотреть анкету →"}
                </Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
      {filtersOpen && (
        <FiltersSheet
          value={filters}
          onApply={(f) => {
            setFilters(f);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}{" "}
      {sortOpen && (
        <Modal title="Сортировка лайков" onClose={() => setSortOpen(false)}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {LIKES_SORT_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={prefs.likesSort === o.id}
                onPress={() => {
                  setPrefs({ likesSort: o.id });
                  setSortOpen(false);
                }}
              />
            ))}
          </View>
        </Modal>
      )}
    </Page>
  );
}
