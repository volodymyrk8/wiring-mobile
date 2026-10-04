import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useState } from "react";
import { View } from "react-native";
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
  return (
    <View style={{ gap: 6, minWidth: 190 }}>
      <Button
        title={`${status.playing ? "Пауза" : "Слушать"} · ${Math.floor(status.currentTime || 0)} / ${Math.round(status.duration || message.audio_duration || 0)} c`}
        kind="ghost"
        onPress={() => {
          if (status.playing) player.pause();
          else {
            if (status.didJustFinish) void player.seekTo(0);
            player.play();
          }
        }}
      />
      {transcript ? (
        <Text style={{ color: t.text, lineHeight: 20 }}>{transcript}</Text>
      ) : (
        <Button
          title="В текст"
          kind="ghost"
          busy={busy}
          onPress={() => void transcribe()}
        />
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
