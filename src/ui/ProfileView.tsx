import { tr, useLanguage } from "../i18n";
import { useState, useRef } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";
import { mediaSource } from "../api/client";
import type { Person } from "../api/types";
import { useCatalog, useTagLabel } from "../catalog";
import { useTheme } from "../theme";
import { useLayout } from "./layout";
import { Hint } from "./Page";
import { Chip, SectionTitle } from "./kit";
import { Text, fonts } from "./Typography";
export function ProfileView({ person }: { person: Person }) {
  useLanguage();
  const gallery = useRef<ScrollView>(null);
  const t = useTheme();
  const label = useTagLabel();
  const catalog = useCatalog();
  const { contentWidth, height } = useLayout();
  const width = Math.min(contentWidth - 32, height * 0.66 * 0.75);
  const [page, setPage] = useState(0);
  const aspect = 0.75;
  const photos = person.photos?.length
    ? person.photos
    : person.photo
      ? [person.photo]
      : [];
  const h = Math.min(height * 0.66, width / aspect);
  return (
    <View>
      <View
        style={{
          width, alignSelf: "center",
          overflow: "hidden",
          borderRadius: 26,
          backgroundColor: t.photo,
        }}
      >
        <ScrollView
          ref={gallery}
          horizontal
          pagingEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setPage(Math.round(e.nativeEvent.contentOffset.x / width))
          }
        >
          {photos.map((p, i) => (
            <Image
              key={i}
              source={mediaSource(p)}
              style={{ width, height: h }}
              contentFit="cover"
              accessibilityLabel={tr("Фото {0} из {1}: {2}", i + 1, photos.length, person.name)}

            />
          ))}
        </ScrollView>
      </View>
      {photos.length > 1 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {photos.map((p, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={tr("Фото {0}", i + 1)}
              accessibilityState={{ selected: i === page }}
              onPress={() => {
                setPage(i);
                gallery.current?.scrollTo({ x: width * i, animated: true });
              }}
            >
              <Image
                source={mediaSource(p)}
                style={{
                  width: 44,
                  height: 56,
                  borderRadius: 8,
                  borderWidth: i === page ? 2 : 0,
                  borderColor: t.accent,
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 32,
          color: t.text,
          marginTop: 16,
        }}
      >
        {person.online ? "● " : ""}
        {person.name}
        {person.age ? `, ${person.age}` : ""}
      </Text>
      <Hint>
        {[
          catalog?.genders?.find((i) => i.id === person.gender)?.label,
          catalog?.looking_for?.find((i) => i.id === person.looking_for)?.label,
          tr(person.city || ""),
          person.height ? tr("{0} см", person.height) : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Hint>
      <Hint>
        {tr("Диагнозы не проверяем: люди указывают их сами. Если заметим ложь, аккаунт может быть забанен.")}</Hint>
      {!!person.bio && (
        <Text
          style={{
            color: t.text,
            fontSize: 16,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          {person.bio}
        </Text>
      )}
      {!!person.job?.trim() && (
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
          {tr("Занятость: ")}{person.job.trim()}
        </Text>
      )}
      {!!person.communication && (
        <>
          <SectionTitle>{tr("как тебе писать")}</SectionTitle>
          <Hint>{person.communication}</Hint>
        </>
      )}
      {person.prompts?.map((p) => (
        <View key={p.id}>
          <SectionTitle>
            {catalog?.prompts?.find((i) => i.id === p.id)?.label || p.id}
          </SectionTitle>
          <Hint>{p.answer}</Hint>
        </View>
      ))}
      {[
        [tr("Особенности"), person.neuro],
        [tr("Вайб"), person.vibe],
        [tr("Что ищет"), person.intents],
      ].map(([title, ids]) =>
        Array.isArray(ids) && ids.length ? (
          <View key={String(title)}>
            <SectionTitle>{String(title)}</SectionTitle>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {ids.map((id) => (
                <Chip key={id} label={label(id)} />
              ))}
            </View>
          </View>
        ) : null,
      )}
    </View>
  );
}
