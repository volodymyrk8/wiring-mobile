import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { View } from "react-native";
import { mediaSource } from "../api/client";
import type { Person } from "../api/types";
import { useTheme } from "../theme";
import { Modal, Hint } from "./Page";
import { Button } from "./kit";
export function MatchModal({
  person,
  onClose,
  onWrite,
}: {
  person: Person | null;
  onClose: () => void;
  onWrite: () => void;
}) {
  const t = useTheme();
  useEffect(() => {
    if (person)
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
  }, [person]);
  if (!person) return null;
  return (
    <Modal title="Взаимный лайк" onClose={onClose}>
      <Image
        source={mediaSource(person.photo || person.photos?.[0])}
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          alignSelf: "center",
          backgroundColor: t.chip,
          marginBottom: 16,
        }}
      />
      <Hint>
        У вас взаимная симпатия с {person.name}. Можно написать первым.
      </Hint>
      <View style={{ gap: 8 }}>
        <Button title="Написать" onPress={onWrite} />
        <Button title="Продолжить ленту" kind="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}
