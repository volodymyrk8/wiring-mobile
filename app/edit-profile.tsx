import { tr, useLanguage } from "../src/i18n";
import { applyNeuroToggle } from "../src/catalogTags";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { endpoints, mediaSource } from "../src/api/client";
import { useAuth } from "../src/auth";
import { useCatalog } from "../src/catalog";
import { useTheme } from "../src/theme";
import {
  createAutosave,
  type SaveState,
} from "../src/features/profile/autosave";
import {
  profileDraft,
  profilePayload,
  restoreDraft,
  type Draft,
} from "../src/features/profile/draft";
import {
  Button,
  Chip,
  Field,
  Loading,
  Row,
  SectionTitle,
  Toggle,
  ErrorText,
} from "../src/ui/kit";
import { Page, Title, Hint, Check, Confirm } from "../src/ui/Page";
import { Text } from "../src/ui/Typography";
import { CityPicker } from "../src/ui/CityPicker";
export default function EditProfile({
  embedded = false,
}: { embedded?: boolean } = {}) {
  useLanguage();
  const { user, setUser, refresh } = useAuth();
  const router = useRouter();
  const catalog = useCatalog();
  const t = useTheme();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [state, setState] = useState<SaveState>({
    phase: "idle",
    local: false,
    error: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [remove, setRemove] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const saver = useRef<ReturnType<
    typeof createAutosave<Draft, { user: NonNullable<typeof user> }>
  > | null>(null);
  const initialUser = useRef(user);
  useEffect(() => {
    initialUser.current = user;
  }, [user]);
  useEffect(() => {
    if (!initialUser.current) return;
    let alive = true;
    const key = `wiring.profile-draft.${initialUser.current.id}`;
    const initial = profileDraft(initialUser.current);
    void AsyncStorage.getItem(key)
      .catch(() => null)
      .then((raw) => {
        if (!alive) return;
        const restored = restoreDraft(raw, initial);
        setDraft(restored);
        const controller = createAutosave({
          key,
          initial: restored,
          restored: !!raw,
          storage: AsyncStorage,
          save: (value, publish) =>
            endpoints.saveProfile(profilePayload(value, publish)),
          onSaved: (r) => setUser(r.user),
          onState: setState,
        });
        saver.current = controller;
        controller.start();
      });
    return () => {
      alive = false;
      saver.current?.dispose();
      saver.current = null;
    };
  }, [user?.id, setUser]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    if (!draft) return;
    const next = { ...draft, [key]: value };
    setDraft(next);
    saver.current?.update(next);
  };
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не получилось"));
    } finally {
      setBusy(false);
    }
  };
  const photos = (user?.photos || []).filter(
    (p): p is { id: number; url: string; is_primary?: boolean } =>
      typeof p !== "string" && p.id !== undefined,
  );
  const upload = async () => {
    await run(async () => {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });
      if (picked.canceled) return;
      const a = picked.assets[0];
      await endpoints.uploadPhoto(
        a.uri,
        a.mimeType || "image/jpeg",
        a.fileName || "photo.jpg",
      );
      await refresh();
    });
  };
  if (!user || !catalog || !draft)
    return (
      <Page title={tr("Моя анкета")} back={!embedded}>
        <ErrorText>{error}</ErrorText>
        <Loading />
      </Page>
    );
  if (user.needs_profile_setup) return (
    <Page title={tr("Заверши анкету")} back={false}>
      <Title>{tr("Заверши анкету")}</Title>
      <Hint>{tr("Укажи имя, возраст и добавь изображение. Остальное можно заполнить позже.")}</Hint>
      <Hint>{tr("Анкета появится в ленте только после публикации.")}</Hint>
      <Field label={tr("Имя")} value={draft.name} onChangeText={v => set("name", v)} maxLength={32} />
      <Field label={tr("Возраст")} value={draft.age} onChangeText={v => set("age", v)} keyboardType="number-pad" maxLength={2} />
      <Hint>{tr("Можно загрузить фото, рисунок или мем. Показывать лицо не обязательно.")}</Hint>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {photos.map(p => <Image key={p.id} source={mediaSource(p.url)} style={{ width: 96, height: 120, borderRadius: 14 }} />)}
      </View>
      <Button title={tr("+ Добавить фото")} kind="ghost" busy={busy} onPress={() => void upload()} />
      {draft.neuro.length > 0 && <Check checked={draft.special_data_consent} onChange={value => set("special_data_consent", value)} label={tr("Согласен(на) на обработку и показ выбранных особенностей")} />}
      <ErrorText>{error || (state.phase === "error" ? state.error : "")}</ErrorText>
      <Button title={tr("Опубликовать анкету")} busy={busy} onPress={() => void run(async () => {
        const age = Number(draft.age);
        if (draft.name.trim().length < 2 || !Number.isInteger(age) || age < 18 || age > 99) throw new Error(tr("Укажи имя и возраст от 18 до 99 лет"));
        if (!photos.length && !user.photo) throw new Error(tr("Добавь изображение для анкеты"));
        const result = await saver.current?.save(true);
        if (result && !result.user.needs_profile) router.replace("/(tabs)/feed");
      })} />
    </Page>
  );
  const choices = (
    key: "neuro" | "vibe" | "intents",
    items: { id: string; label?: string }[] = [],
  ) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((i) => (
        <Chip
          key={i.id}
          label={i.label || i.id}
          selected={draft[key].includes(i.id)}
          onPress={() => {
            const next = draft[key].includes(i.id)
              ? draft[key].filter((x) => x !== i.id)
              : [...draft[key], i.id];
            set(
              key,
              key === "neuro" ? applyNeuroToggle(draft[key], next) : next,
            );
          }}
        />
      ))}
    </View>
  );
  const selects = (
    key: "gender" | "looking_for",
    items: { id: string; label?: string }[] = [],
  ) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((i) => (
        <Chip
          key={i.id}
          label={i.label || i.id}
          selected={draft[key] === i.id}
          onPress={() => set(key, i.id)}
        />
      ))}
    </View>
  );
  return (
    <Page title={tr("Профиль")} back={!embedded}>
      <Title>{tr("Моя анкета")}</Title>
      <Hint>{tr("Фото, немного о себе и то, как тебе комфортно общаться.")}</Hint>
      <Hint>
        {state.phase === "idle"
          ? tr("Изменения сохраняются автоматически.")
          : state.phase === "saved"
            ? tr("Изменения сохранены")
            : state.phase === "saving"
              ? tr("Сохраняем…")
              : state.local
                ? tr("Черновик сохранён на устройстве")
                : tr("Черновик пока не сохранён на устройстве")}
      </Hint>
      {state.phase === "error" && (
        <>
          <ErrorText>{tr(state.error)}</ErrorText>
          <Button
            title={tr("Повторить сохранение")}
            kind="ghost"
            onPress={() => void saver.current?.save().catch(() => {})}
          />
        </>
      )}
      <SectionTitle>{tr("Фото")}</SectionTitle>
      <Hint>{tr("Меняй порядок стрелками под фото. Первое фото — аватар в ленте.")}</Hint>
      <Hint>{tr("Можно загрузить фото, рисунок или мем. Показывать лицо не обязательно.")}</Hint>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {photos.map((p, index) => (
          <View
            key={p.id}
            style={{
              width: "23%",
              aspectRatio: 0.75,
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: p.is_primary ? 2 : 1,
              borderColor: p.is_primary ? t.accent : t.border,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              accessibilityLabel={tr("Сделать аватаром")}
              onPress={() =>
                void run(async () => {
                  await endpoints.primaryPhoto(p.id);
                  await refresh();
                })
              }
            >
              <Image
                source={mediaSource(p)}
                style={{ width: "100%", height: "100%" }}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={tr("Удалить фото")}
              onPress={() => setRemove(p.id)}
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                backgroundColor: "rgba(0,0,0,.7)",
                borderRadius: 14,
                padding: 6,
              }}
            >
              <Text style={{ color: "white" }}>×</Text>
            </Pressable>
            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: t.card }}>
              {[-1, 1].map((delta) => <Pressable key={delta} disabled={busy || index + delta < 0 || index + delta >= photos.length}
                accessibilityLabel={tr("Передвинуть фото {0} {1}", index + 1, delta < 0 ? tr("влево") : tr("вправо"))}
                style={{ padding: 6, opacity: index + delta < 0 || index + delta >= photos.length ? 0.3 : 1 }}
                onPress={() => void run(async () => {
                  const ids = photos.map((photo) => photo.id);
                  [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
                  await endpoints.orderPhotos(ids); await refresh();
                })}><Text style={{ color: t.text }}>{delta < 0 ? "←" : "→"}</Text></Pressable>)}
            </View>
            {p.is_primary && (
              <Text
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  color: t.accentText,
                  backgroundColor: t.accent,
                  padding: 3,
                  fontSize: 10,
                }}
              >
                {tr("аватар")}</Text>
            )}
          </View>
        ))}
        {photos.length < (catalog.limits?.photos || 6) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("Добавить фото")}
            disabled={busy}
            onPress={() => void upload()}
            style={{
              width: "23%",
              aspectRatio: 0.75,
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: t.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.muted, fontSize: 30 }}>+</Text>
          </Pressable>
        )}
      </View>
      <Hint>{tr("Нажми фото, чтобы выбрать аватар.")}</Hint>
      <SectionTitle>{tr("Основное")}</SectionTitle>
      <Field
        label={tr("Имя")}
        value={draft.name}
        onChangeText={(v) => set("name", v)}
        maxLength={32}
      />
      <Field
        label={tr("Возраст")}
        value={draft.age}
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={(v) => set("age", v)}
      />
      <SectionTitle>{tr("Пол")}</SectionTitle>
      {selects("gender", catalog.genders)}
      <SectionTitle>{tr("Кого ищешь")}</SectionTitle>
      {selects("looking_for", catalog.looking_for)}
      <Row
        icon="location-outline"
        title={tr("Город")}
        subtitle={draft.city || tr("Не указывать")}
        onPress={() => setCityOpen(true)}
      />
      <Field
        label={tr("Рост, см")}
        value={draft.height}
        keyboardType="number-pad"
        maxLength={3}
        onChangeText={(v) => set("height", v)}
      />
      <Field
        label={tr("Занятие")}
        value={draft.job}
        onChangeText={(v) => set("job", v)}
        maxLength={120}
      />
      <SectionTitle>{tr("Что ищешь")}</SectionTitle>
      {choices("intents", catalog.intents)}
      <Field
        label={tr("Био")}
        value={draft.bio}
        onChangeText={(v) => set("bio", v)}
        multiline
        maxLength={catalog.limits?.bio || 1200}
        style={{ minHeight: 100 }}
      />
      <Field
        label={tr("Как тебе писать")}
        value={draft.communication}
        onChangeText={(v) => set("communication", v)}
        multiline
        maxLength={500}
      />
      <SectionTitle>{tr("Мои особенности")}</SectionTitle>
      <Check
        checked={draft.special_data_consent}
        onChange={(v) => set("special_data_consent", v)}
        label={tr("Согласен(на) на обработку и показ выбранных особенностей")}
      />
      {choices("neuro", catalog.neuro)}
      <Hint>{tr("Диагнозы не проверяем: люди указывают их сами.")}</Hint>
      <SectionTitle>{tr("Вайб")}</SectionTitle>
      {choices("vibe", catalog.vibe)}
      <SectionTitle>{tr("Промпты")}</SectionTitle>
      {draft.prompts.map((p, i) => (
        <View key={p.id}>
          <Field
            label={catalog.prompts?.find((x) => x.id === p.id)?.label || p.id}
            value={p.answer}
            multiline
            maxLength={280}
            onChangeText={(v) =>
              set(
                "prompts",
                draft.prompts.map((x, j) =>
                  j === i ? { ...x, answer: v } : x,
                ),
              )
            }
          />
          <Button
            title={tr("Убрать промпт")}
            kind="ghost"
            onPress={() =>
              set(
                "prompts",
                draft.prompts.filter((_, j) => j !== i),
              )
            }
          />
        </View>
      ))}
      {draft.prompts.length < 3 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {catalog.prompts
            ?.filter((p) => !draft.prompts.some((x) => x.id === p.id))
            .map((p) => (
              <Chip
                key={p.id}
                label={p.label || p.id}
                onPress={() =>
                  set("prompts", [...draft.prompts, { id: p.id, answer: "" }])
                }
              />
            ))}
        </View>
      )}
      <SectionTitle>{tr("Для тебя")}</SectionTitle>
      {user.jev_feed_unlocked ? (
        <Row
          icon="sparkles-outline"
          title={tr("Включить вкладку «Для тебя»")}
          right={
            <Toggle
              value={!!user.jev_feed_enabled}
              disabled={busy}
              onValueChange={(v) =>
                void run(async () =>
                  setUser((await endpoints.recommendationsEnabled(v)).user),
                )
              }
            />
          }
        />
      ) : (
        <>
          <Field
            label={tr("Промокод для рекомендаций")}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
          <Button
            title={tr("Активировать")}
            disabled={!code.trim()}
            busy={busy}
            onPress={() =>
              void run(async () => {
                setUser((await endpoints.redeem(code.trim())).user);
                setCode("");
              })
            }
          />
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <View style={{ gap: 10, marginTop: 20 }}>
        <Button
          title={user.needs_profile ? tr("Опубликовать анкету") : tr("Сохранить")}
          busy={busy}
          onPress={() =>
            void run(async () => {
              const result = await saver.current?.save(true);
              if (user.needs_profile && result?.user)
                router.replace(
                  result.user.needs_onboard ? "/onboard" : "/(tabs)/feed",
                );
            })
          }
        />
        <Button
          title={tr("Посмотреть анкету")}
          kind="ghost"
          onPress={() => router.push(`/person/${user.id}`)}
        />
        <Button
          title={tr("Кому показывать мою анкету")}
          kind="ghost"
          onPress={() => router.push("/visibility")}
        />
        <Button
          title="WIRING+"
          kind="ghost"
          onPress={() => router.push("/plus")}
        />
        <Button
          title={tr("Удалить аккаунт")}
          kind="danger"
          onPress={() => router.push("/delete-account")}
        />
      </View>
      <CityPicker
        visible={cityOpen}
        allowAny
        places={catalog.places || []}
        onClose={() => setCityOpen(false)}
        onPick={(v) => {
          set("city", v);
          setCityOpen(false);
        }}
      />
      {remove !== null && (
        <Confirm
          title={tr("Удалить фото?")}
          body={tr("Фото исчезнет из анкеты.")}
          label={tr("Удалить")}
          busy={busy}
          onClose={() => !busy && setRemove(null)}
          onConfirm={() =>
            void run(async () => {
              await endpoints.deletePhoto(remove);
              await refresh();
              setRemove(null);
            })
          }
        />
      )}
    </Page>
  );
}
