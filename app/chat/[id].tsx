import { tr, getLocale, useLanguage } from "../../src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { endpoints, mediaSource } from "../../src/api/client";
import type { Message, Thread } from "../../src/api/types";
import { Voice } from "../../src/features/chat/Voice";
import { useTheme } from "../../src/theme";
import { Avatar, Button, ErrorText, Field, Loading } from "../../src/ui/kit";
import { Column } from "../../src/ui/layout";
import { Confirm, Header, Hint, Modal } from "../../src/ui/Page";
import { Text, fonts } from "../../src/ui/Typography";

type Pending = { cid: string; body: string; reply?: number; failed: boolean };
const time = (ts: number) =>
  new Date(ts * 1000).toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
export default function ChatScreen() {
  const peerId = Number(useLocalSearchParams<{ id: string }>().id);
  return <ChatThreadScreen key={peerId} peerId={peerId} />;
}
function ChatThreadScreen({ peerId }: { peerId: number }) {
  useLanguage();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [peer, setPeer] = useState<Thread["peer"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [openers, setOpeners] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Message | null>(null);
  const [selected, setSelected] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [photoDraft, setPhotoDraft] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useAudioRecorderState(recorder);
  const active = useRef(false);
  const sequence = useRef(0);
  const pollRequest = useRef(0);
  const stopping = useRef(false);
  const poll = useCallback(async () => {
    const request = ++pollRequest.current;
    const seq = sequence.current;
    try {
      const r = await endpoints.thread(peerId);
      if (active.current && sequence.current === seq && request === pollRequest.current) {
        setPeer(r.peer);
        setMessages(r.messages);
        setOpeners(r.openers || []);
        setError("");
      }
    } catch (e) {
      if (active.current && sequence.current === seq && request === pollRequest.current)
        setError(e instanceof Error ? e.message : tr("Чат недоступен"));
    }
  }, [peerId]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void poll();
      const interval = setInterval(() => {
        if (AppState.currentState === "active") void poll();
      }, 8000);
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") void poll();
      });
      return () => {
        active.current = false;
        sequence.current++;
        clearInterval(interval);
        sub.remove();
        // The audio hook can release its native object before focus cleanup
        // runs on unmount. A disposed recorder must not crash navigation.
        try {
          if (recorder.isRecording) void recorder.stop().catch(() => undefined);
        } catch {
          // The hook has already disposed the recorder and its recording.
        }
        void setAudioModeAsync({ allowsRecording: false });
      };
    }, [poll, recorder]),
  );
  const deliver = async (item: Pending) => {
    setPending((p) =>
      p.map((v) => (v.cid === item.cid ? { ...v, failed: false } : v)),
    );
    try {
      await endpoints.send(peerId, item.body, item.cid, item.reply);
      if (active.current) {
        setPending((p) => p.filter((v) => v.cid !== item.cid));
        await poll();
      }
    } catch (e) {
      if (active.current) {
        setPending((p) =>
          p.map((v) => (v.cid === item.cid ? { ...v, failed: true } : v)),
        );
        setError(e instanceof Error ? e.message : tr("Не отправлено"));
      }
    }
  };
  const send = () => {
    if (!text.trim()) return;
    const item = {
      cid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      body: text.trim(),
      reply: reply?.id,
      failed: false,
    };
    setText("");
    setReply(null);
    setPending((p) => [...p, item]);
    void deliver(item);
  };
  const sendPhoto = async () => {
    if (busy || recording.isRecording) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (picked.canceled || !picked.assets[0] || !active.current) return;
    setPhotoDraft(picked.assets.slice(0, 10));
  };
  const confirmPhotos = async () => {
    if (busy || !photoDraft.length) return;
    setBusy(true);
    try {
      await endpoints.sendPhotos(peerId, photoDraft, reply?.id);
      setPhotoDraft([]);
      setReply(null);
      await poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Фото не отправлено"));
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const finishVoice = useCallback(
    async (sendRecording: boolean) => {
      if (stopping.current) return;
      stopping.current = true;
      setBusy(true);
      try {
        const duration = Math.min(90, recording.durationMillis / 1000);
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        if (
          sendRecording &&
          recorder.uri &&
          duration >= 0.5 &&
          active.current
        ) {
          await endpoints.sendVoice(peerId, recorder.uri, duration, reply?.id);
          setReply(null);
          await poll();
        }
      } catch (e) {
        if (active.current)
          setError(e instanceof Error ? e.message : tr("Запись не отправлена"));
      } finally {
        stopping.current = false;
        if (active.current) setBusy(false);
      }
    },
    [recorder, recording.durationMillis, peerId, reply, poll],
  );
  useEffect(() => {
    if (recording.isRecording && recording.durationMillis >= 90000)
      queueMicrotask(() => {
        if (active.current) void finishVoice(true);
      });
  }, [recording, finishVoice]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" && recorder.isRecording) {
        void finishVoice(false);
        setError(tr("Запись отменена при уходе с экрана. Запиши сообщение ещё раз."));
      }
    });
    return () => sub.remove();
  }, [recorder, finishVoice]);
  const startVoice = async () => {
    if (busy || recording.isRecording) return;
    setBusy(true);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError(tr("Разреши доступ к микрофону в настройках телефона"));
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      if (active.current && AppState.currentState === "active") recorder.record();
      else await setAudioModeAsync({ allowsRecording: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не удалось начать запись"));
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const mutate = async (kind: "edit" | "delete") => {
    const message = kind === "edit" ? editing : deleting;
    if (!message || busy) return;
    setBusy(true);
    try {
      if (kind === "edit")
        await endpoints.editMessage(message.id, editText.trim());
      else await endpoints.deleteMessage(message.id);
      setEditing(null);
      setDeleting(null);
      await poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не получилось"));
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const data: (Message | Pending)[] = [...pending].reverse().concat([]) as (
    Message | Pending
  )[];
  data.push(...[...messages].reverse());
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header title={tr("Чат")} back />
      <Column>
        {peer && (
          <Pressable
            onPress={() => router.push(`/person/${peerId}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            <Avatar
              uri={peer.photo}
              name={peer.name}
              size={38}
              online={peer.online}
            />
            <View>
              <Text
                style={{ color: t.text, fontFamily: fonts.serif, fontSize: 23 }}
              >
                {peer.name}
              </Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>
                {peer.online ? tr("в сети") : tr("Профиль и безопасность")}
              </Text>
            </View>
          </Pressable>
        )}
        {!peer && !error ? (
          <Loading />
        ) : (
          <FlatList
            inverted
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            data={data}
            keyExtractor={(m) => ("cid" in m ? m.cid : String(m.id))}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            renderItem={({ item }) => {
              if ("cid" in item)
                return (
                  <Pressable
                    disabled={!item.failed}
                    onPress={() => void deliver(item)}
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "85%",
                      padding: 12,
                      marginVertical: 4,
                      borderRadius: 14,
                      backgroundColor: t.chip,
                    }}
                  >
                    <Text style={{ color: t.text }}>{item.body}</Text>
                    <Text
                      style={{
                        color: item.failed ? t.danger : t.muted,
                        fontSize: 11,
                      }}
                    >
                      {item.failed
                        ? tr("Не отправлено · повторить")
                        : tr("Отправляется…")}
                    </Text>
                  </Pressable>
                );
              const mine = item.mine ?? item.from_id !== peerId;
              return (
                <Pressable
                  onLongPress={() => setSelected(item)}
                  accessibilityHint={tr("Удерживай, чтобы ответить или изменить сообщение")}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    marginVertical: 4,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: mine ? t.chip : t.card,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  {item.reply_to && (
                    <Text
                      style={{
                        color: t.muted,
                        fontSize: 12,
                        borderLeftWidth: 2,
                        borderColor: t.accent,
                        paddingLeft: 8,
                        marginBottom: 8,
                      }}
                    >
                      {item.reply_to.gone
                        ? tr("Сообщение удалено")
                        : item.reply_to.body ||
                          (item.reply_to.has_photo ? tr("Фото") : tr("Голосовое"))}
                    </Text>
                  )}
                  {(item.photo_urls?.length ? item.photo_urls : item.photo_url ? [item.photo_url] : []).map((src) => (
                    <Pressable key={src} accessibilityLabel={tr("Открыть фото")} onPress={() => setPhoto(src)}>
                      <Image source={mediaSource(src)} style={{ width: 220, height: 220, borderRadius: 10, marginBottom: 4 }} contentFit="cover" />
                    </Pressable>
                  ))}
                  {item.audio_url && <Voice message={item} />}
                  {!!item.body && (
                    <Text
                      style={{ color: t.text, fontSize: 15, lineHeight: 21 }}
                    >
                      {item.body}
                    </Text>
                  )}
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 11,
                      alignSelf: "flex-end",
                      marginTop: 5,
                    }}
                  >
                    {item.edited ? tr("изменено · ") : ""}
                    {time(item.created_at)}
                    {mine ? (item.read ? tr(" · прочитано") : tr(" · отправлено")) : ""}
                  </Text>
                </Pressable>
              );
            }}
            ListFooterComponent={
              !messages.length && openers.length ? (
                <View style={{ gap: 8, paddingVertical: 10 }}>
                  <Hint>{tr("Можно начать так")}</Hint>
                  {openers.map((o) => (
                    <Button
                      key={o}
                      title={o}
                      kind="ghost"
                      onPress={() => setText(o)}
                    />
                  ))}
                </View>
              ) : null
            }
          />
        )}
        <ErrorText>{error}</ErrorText>
        {reply && (
          <View
            style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}
          >
            <Text style={{ flex: 1, color: t.muted }} numberOfLines={2}>
              {tr("Ответ: ")}{reply.body || (reply.photo_url ? tr("Фото") : tr("Голосовое"))}
            </Text>
            <Button title="×" kind="ghost" onPress={() => setReply(null)} />
          </View>
        )}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderColor: t.border,
          }}
        >
          {recording.isRecording ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.danger }}>
                {tr("Запись · ")}{Math.floor(recording.durationMillis / 1000)} / 90 c
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title={tr("Отменить")}
                  kind="ghost"
                  busy={busy}
                  onPress={() => void finishVoice(false)}
                />
                <Button
                  title={tr("Отправить запись")}
                  busy={busy}
                  onPress={() => void finishVoice(true)}
                />
              </View>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}
            >
              <Pressable
                accessibilityLabel={tr("Отправить фото")}
                disabled={busy}
                onPress={() => void sendPhoto()}
                style={{ padding: 10 }}
              >
                <Ionicons name="image-outline" size={23} color={t.text} />
              </Pressable>
              <TextInput
                accessibilityLabel={tr("Сообщение")}
                value={text}
                onChangeText={setText}
                placeholder={tr("Сообщение")}
                placeholderTextColor={t.muted}
                maxLength={1000}
                multiline
                style={{
                  flex: 1,
                  color: t.text,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  maxHeight: 120,
                  minHeight: 44,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 14,
                  backgroundColor: t.card,
                }}
              />
              <Pressable
                accessibilityLabel={
                  text.trim() ? tr("Отправить") : tr("Записать голосовое")
                }
                disabled={busy}
                onPress={() => (text.trim() ? send() : void startVoice())}
                style={{
                  backgroundColor: t.btn,
                  borderRadius: 22,
                  padding: 12,
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Ionicons
                  name={text.trim() ? "arrow-up" : "mic-outline"}
                  size={21}
                  color={t.btnText}
                />
              </Pressable>
            </View>
          )}
        </View>
      </Column>
      {photoDraft.length > 0 && (
        <Modal title={photoDraft.length === 1 ? tr("Отправить фото") : tr("Отправить фото · {0}", photoDraft.length)} onClose={() => !busy && setPhotoDraft([])}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {photoDraft.map((a) => <Image key={a.uri} source={{ uri: a.uri }} contentFit={photoDraft.length === 1 ? "contain" : "cover"} style={photoDraft.length === 1 ? { width: "100%", height: 280, borderRadius: 10 } : { width: 100, height: 100, borderRadius: 10 }} />)}
          </View>
          <Hint>{busy ? tr("Загружаем фото…") : photoDraft.length === 1 ? tr("Можно отменить перед отправкой.") : tr("Фото отправятся одним сообщением.")}</Hint>
          <Button title={photoDraft.length === 1 ? tr("Отправить") : tr("Отправить вместе")} busy={busy} onPress={() => void confirmPhotos()} />
          <Button title={tr("Отмена")} kind="ghost" disabled={busy} onPress={() => setPhotoDraft([])} />
        </Modal>
      )}
      {selected && (
        <Modal title={tr("Сообщение")} onClose={() => setSelected(null)}>
          <Button
            title={tr("Ответить")}
            kind="ghost"
            onPress={() => {
              setReply(selected);
              setSelected(null);
            }}
          />
          {selected.mine && (
            <>
              <Button
                title={tr("Изменить")}
                kind="ghost"
                disabled={!selected.body}
                onPress={() => {
                  setEditing(selected);
                  setEditText(selected.body || "");
                  setSelected(null);
                }}
              />
              <Button
                title={tr("Удалить")}
                kind="danger"
                onPress={() => {
                  setDeleting(selected);
                  setSelected(null);
                }}
              />
            </>
          )}
        </Modal>
      )}
      {editing && (
        <Modal
          title={tr("Изменить сообщение")}
          onClose={() => !busy && setEditing(null)}
        >
          <Field
            label={tr("Сообщение")}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={1000}
          />
          <ErrorText>{error}</ErrorText>
          <Button
            title={tr("Сохранить")}
            busy={busy}
            disabled={!editText.trim()}
            onPress={() => void mutate("edit")}
          />
        </Modal>
      )}
      {deleting && (
        <Confirm
          title={tr("Удалить сообщение?")}
          body={tr("Сообщение исчезнет у обоих участников.")}
          label={tr("Удалить")}
          busy={busy}
          onConfirm={() => void mutate("delete")}
          onClose={() => !busy && setDeleting(null)}
        />
      )}
      {photo && (
        <Modal title={tr("Фото")} onClose={() => setPhoto(null)}>
          <Image
            source={mediaSource(photo)}
            style={{ width: "100%", height: 400 }}
            contentFit="contain"
          />
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
