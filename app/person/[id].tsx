import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { endpoints } from "../../src/api/client";
import type { Person } from "../../src/api/types";
import { useAuth } from "../../src/auth";
import { useCatalog } from "../../src/catalog";
import { removeFromFeeds } from "../../src/features/feed/store";
import { Page, Confirm, Modal, Hint } from "../../src/ui/Page";
import { Button, Chip, ErrorText, Field, Loading } from "../../src/ui/kit";
import { ProfileView } from "../../src/ui/ProfileView";
import { MatchModal } from "../../src/ui/MatchModal";
export default function PersonScreen({ own = false }: { own?: boolean } = {}) {
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const id = own ? String(user?.id) : params.id;
  const self = Number(id) === user?.id;
  const router = useRouter();
  const catalog = useCatalog();
  const [person, setPerson] = useState<Person | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"pass" | "block" | "unmatch" | null>(
    null,
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<Person | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      endpoints
        .person(Number(id))
        .then((r) => active && setPerson(r.person))
        .catch((e) => active && setError(e.message));
      return () => {
        active = false;
      };
    }, [id]),
  );
  const action = async (
    kind: "like" | "pass" | "block" | "unmatch" | "report" | "snooze",
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (kind === "block") await endpoints.block(Number(id));
      else if (kind === "unmatch") await endpoints.unmatch(Number(id));
      else if (kind === "report")
        await endpoints.report(Number(id), reason, details);
      else {
        const res = await endpoints.swipe(Number(id), kind);
        if (res.matched) {
          setMatch(res.match || person);
          setPerson((p) => (p ? { ...p, matched: true } : p));
          return;
        }
      }
      removeFromFeeds(Number(id));
      setConfirm(null);
      setReportOpen(false);
      if (kind === "like")
        setPerson((p) => (p ? { ...p, you_liked: true } : p));
      else if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Профиль" back={!own}>
      <ErrorText>{error}</ErrorText>
      {!person ? (
        <Loading />
      ) : (
        <>
          <ProfileView person={person} />
          <View style={{ gap: 10, marginTop: 18 }}>
            {self ? (
              <>
                <Button
                  title="Редактировать анкету"
                  onPress={() => router.push("/edit-profile")}
                />
                <Button
                  title="Лайки, дизлайки и блок"
                  kind="ghost"
                  onPress={() => router.push("/archive")}
                />
              </>
            ) : (
              <>
                {person.matched ? (
                  <Button
                    title="Написать"
                    onPress={() => router.push(`/chat/${id}`)}
                  />
                ) : (
                  <>
                    <Button
                      title={person.you_liked ? "Лайк отправлен" : "Лайк"}
                      disabled={person.you_liked || busy}
                      onPress={() => void action("like")}
                    />
                    <Button
                      title="Скрыть"
                      kind="ghost"
                      disabled={busy}
                      onPress={() => setConfirm("pass")}
                    />
                    {user?.plus && (
                      <Button
                        title="Отложить на неделю"
                        kind="ghost"
                        disabled={busy}
                        onPress={() => void action("snooze")}
                      />
                    )}
                  </>
                )}
                <Button
                  title="Пожаловаться"
                  kind="ghost"
                  onPress={() => setReportOpen(true)}
                />
                <Button
                  title="Заблокировать"
                  kind="danger"
                  onPress={() => setConfirm("block")}
                />
                {person.matched && (
                  <Button
                    title="Убрать из чатов"
                    kind="ghost"
                    onPress={() => setConfirm("unmatch")}
                  />
                )}
              </>
            )}
          </View>
        </>
      )}
      {confirm && (
        <Confirm
          title={
            confirm === "pass"
              ? "Скрыть анкету?"
              : confirm === "block"
                ? "Заблокировать?"
                : "Убрать из чатов?"
          }
          body={
            confirm === "block"
              ? "Человек исчезнет из ленты и чатов. Разблокировать можно в архиве."
              : "Переписка скроется, анкета уйдёт в дизлайки. Вернуть её можно в архиве своих решений."
          }
          busy={busy}
          onConfirm={() => void action(confirm)}
          onClose={() => !busy && setConfirm(null)}
        />
      )}{" "}
      {reportOpen && (
        <Modal
          title="Пожаловаться"
          onClose={() => !busy && setReportOpen(false)}
        >
          <Hint>Выбери причину. Жалоба скроет человека из ленты и чатов.</Hint>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {(
              catalog?.report_reasons || [
                { id: "spam", label: "Спам" },
                { id: "fake", label: "Чужие фото" },
                { id: "harassment", label: "Домогательство" },
                { id: "underage", label: "Нет 18" },
                { id: "other", label: "Другое" },
              ]
            ).map((i) => (
              <Chip
                key={i.id}
                label={i.label || i.id}
                selected={reason === i.id}
                onPress={() => setReason(i.id)}
              />
            ))}
          </View>
          <Field
            label="Подробности"
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={280}
          />
          <ErrorText>{error}</ErrorText>
          <Button
            title="Отправить жалобу"
            busy={busy}
            disabled={!reason}
            onPress={() => void action("report")}
          />
        </Modal>
      )}
      <MatchModal
        person={match}
        onClose={() => setMatch(null)}
        onWrite={() => {
          setMatch(null);
          router.push(`/chat/${id}`);
        }}
      />
    </Page>
  );
}
