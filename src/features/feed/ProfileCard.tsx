import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ScrollView, Pressable, View } from "react-native";
import type { Person } from "../../api/types";
import { mediaSource } from "../../api/client";
import { useTagLabel } from "../../catalog";
import { useAuth } from "../../auth";
import { useTheme } from "../../theme";
import { Text, fonts } from "../../ui/Typography";
export function ProfileCard({
  person,
  width,
  height,
}: {
  person: Person;
  width: number;
  height: number;
}) {
  const t = useTheme();
  const { user } = useAuth();
  const label = useTagLabel();
  const [aspect, setAspect] = useState(0.75);
  const [page, setPage] = useState(0);
  const photos = person.photos?.length
    ? person.photos
    : person.photo
      ? [person.photo]
      : [];
  const w = Math.min(width, 508, height * aspect),
    h = Math.min(height, w / aspect);
  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: t.photo,
        alignSelf: "center",
      }}
    >
      <ScrollView
        horizontal
        pagingEnabled
        directionalLockEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / w))
        }
      >
        {photos.map((p, i) => (
          <Image
            key={i}
            source={mediaSource(p)}
            contentFit="cover"
            style={{ width: w, height: h }}
            accessibilityLabel={`Фото ${i + 1} из ${photos.length}: ${person.name}`}
            onLoad={(e) => {
              if (i === page && e.source.width && e.source.height)
                setAspect(e.source.width / e.source.height);
            }}
          />
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 14,
          left: 12,
          right: 12,
          flexDirection: "row",
          gap: 4,
        }}
      >
        {photos.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i === page ? t.accent : "rgba(255,255,255,.5)",
            }}
          />
        ))}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(17,14,12,.78)", "rgba(17,14,12,.94)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Math.min(230, h * 0.5),
        }}
      />
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", bottom: 10, left: 14, right: 14 }}
      >
        <Text
          style={{ fontFamily: fonts.serif, fontSize: 28, color: t.onPhoto }}
        >
          {person.online ? "● " : ""}
          {person.name}
          {person.age ? `, ${person.age}` : ""}
        </Text>
        <Text
          style={{ fontSize: 12, color: t.onPhotoMuted, marginVertical: 4 }}
        >
          {[
            person.city,
            person.job,
            person.height ? `${person.height} см` : "",
            person.intents?.map(label).join(", "),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {!!person.bio && (
          <Text
            numberOfLines={2}
            style={{
              color: t.onPhoto,
              fontSize: 13,
              lineHeight: 18,
              marginBottom: 6,
            }}
          >
            {person.bio}
          </Text>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {[...(person.neuro || []), ...(person.vibe || [])].map((id) => {
            const shared =
              user?.neuro?.includes(id) || user?.vibe?.includes(id);
            return (
              <View
                key={id}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  backgroundColor: shared ? t.accent : "rgba(255,255,255,.18)",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: shared ? t.accentText : t.onPhoto,
                  }}
                >
                  {label(id)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      {photos.length > 1 && (
        <View style={{ position: "absolute", top: 26, right: 12 }}>
          <Text style={{ color: t.onPhoto, fontSize: 11 }}>
            {page + 1}/{photos.length}
          </Text>
        </View>
      )}
    </View>
  );
}
export function ActionCircle({
  label,
  children,
  onPress,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {children}
      </Pressable>
      <Text style={{ color: t.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}
