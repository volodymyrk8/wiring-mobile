import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { endpoints, mediaSource } from "../src/api/client";
import { useAuth } from "../src/auth";
import { useCatalog } from "../src/catalog";
import { profileDraft, profilePayload } from "../src/features/profile/draft";
import { Page, Title, Hint, Check } from "../src/ui/Page";
import { Button, ErrorText, Field, Row } from "../src/ui/kit";
import { CityPicker } from "../src/ui/CityPicker";
export default function Onboard() {
  const { user, setUser, refresh } = useAuth();
  const catalog = useCatalog();
  const router = useRouter();
  const [city, setCity] = useState(user?.city || "");
  const [communication, setCommunication] = useState(user?.communication || "");
  const [answer, setAnswer] = useState(user?.prompts?.[0]?.answer || "");
  const [consent, setConsent] = useState(!user?.needs_photo_consent);
  const [cityOpen, setCityOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const prompt =
    user?.prompts?.[0]?.id || catalog?.prompts?.[0]?.id || "special";
  const photo = async () => {
    if (!consent) {
      setError("Сначала отметь галочку про свои фото");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]) return;
    setBusy(true);
    try {
      const a = picked.assets[0];
      await endpoints.uploadPhoto(
        a.uri,
        a.mimeType || "image/jpeg",
        a.fileName || "photo.jpg",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Фото не загрузилось");
    } finally {
      setBusy(false);
    }
  };
  const finish = async (skip: boolean) => {
    if (!user || busy) return;
    if (!skip && !city) {
      setError("Выбери город");
      return;
    }
    setBusy(true);
    try {
      if (!skip) {
        const draft = {
          ...profileDraft(user),
          city,
          communication,
          prompts: answer.trim().length >= 4 ? [{ id: prompt, answer }] : [],
        };
        const r = await endpoints.saveProfile(profilePayload(draft, true));
        setUser(r.user);
      }
      await endpoints.skipOnboard();
      await refresh();
      router.replace("/(tabs)/feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
      setBusy(false);
    }
  };
  return (
    <Page title="Настройка" back={false}>
      <Title>Ещё чуть-чуть</Title>
      <Hint>
        Два фото и один промпт сильно лучше пустой анкеты. Можно пропустить, но
        тогда тебя труднее узнать.
      </Hint>
      <Hint>Фото — хотя бы ещё одно</Hint>
      {user?.needs_photo_consent && (
        <Check
          checked={consent}
          onChange={setConsent}
          label="Загружаю только свои фото и разрешаю показывать их участникам WIRING"
        />
      )}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {user?.photos?.map((p, i) => (
          <Image
            key={i}
            source={mediaSource(p)}
            style={{ width: 96, height: 120, borderRadius: 14 }}
          />
        ))}
      </View>
      <Button
        title="+ Добавить фото"
        kind="ghost"
        disabled={busy}
        onPress={() => void photo()}
      />
      <Row
        icon="location-outline"
        title="Город"
        subtitle={city || "Не указывать"}
        onPress={() => setCityOpen(true)}
      />
      <Field
        label="Как тебе писать"
        placeholder="Сразу по делу, голосовые ок / нет"
        value={communication}
        onChangeText={setCommunication}
        multiline
        maxLength={500}
      />
      <Field
        label={
          catalog?.prompts?.find((p) => p.id === prompt)?.label || "Один промпт"
        }
        placeholder="Расскажи что-то важное о себе"
        value={answer}
        onChangeText={setAnswer}
        multiline
        maxLength={280}
      />
      <ErrorText>{error}</ErrorText>
      <Button
        title="Дальше в ленту"
        busy={busy}
        onPress={() => void finish(false)}
      />
      <Button
        title="Пропустить"
        kind="ghost"
        disabled={busy}
        onPress={() => void finish(true)}
      />
      <CityPicker
        visible={cityOpen}
        places={catalog?.places || []}
        onClose={() => setCityOpen(false)}
        onPick={(v) => {
          setCity(v);
          setCityOpen(false);
        }}
      />
    </Page>
  );
}
