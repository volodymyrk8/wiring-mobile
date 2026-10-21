import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { endpoints, mediaSource } from "../../api/client";
import type { Message } from "../../api/types";
import { Button, ErrorText } from "../../ui/kit";
import { Text } from "../../ui/Typography";
import { useTheme } from "../../theme";
export function Voice({ message }: { message: Message }) {
  const t = useTheme();
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);
  const player = useAudioPlayer(mediaSource(message.audio_url));
  const status = useAudioPlayerStatus(player);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const transcribe = async () => {
    setBusy(true);
    try {
      const r = await endpoints.transcribe(message.id);
      setTranscript(r.transcript);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось распознать");
    } finally {
      setBusy(false);
    }
  };
  const seconds = Math.max(0, status.currentTime || 0);
  const total = Math.max(0, status.duration || message.audio_duration || 0);
  const clock = (v: number) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, "0")}`;
  return (
    <View style={{ gap: 10, width: 220, maxWidth: "100%" }}>
      <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? "Пауза" : "Слушать голосовое"}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}
        onPress={() => {
          if (status.playing) player.pause();
          else { if (status.didJustFinish) void player.seekTo(0); player.play(); }
        }}>
        <View style={{ backgroundColor: t.btn, padding: 10, borderRadius: 22 }}><Ionicons name={status.playing ? "pause" : "play"} size={20} color={t.btnText} /></View>
        <View style={{ flex: 1, height: 4, backgroundColor: t.border, borderRadius: 2 }}>
          <View style={{ height: 4, width: `${total ? Math.min(100, seconds / total * 100) : 0}%`, backgroundColor: t.accent, borderRadius: 2 }} />
        </View>
        <Text style={{ color: t.text, fontSize: 12, fontVariant: ["tabular-nums"] }}>{clock(status.playing ? seconds : total)}</Text>
      </Pressable>
      {transcript ? (
        <Text style={{ color: t.text, lineHeight: 20 }}>{transcript}</Text>
      ) : (
        <Button
          title="Расшифровать"
          kind="ghost"
          busy={busy}
          onPress={() => void transcribe()}
        />
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
