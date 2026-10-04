import { useState } from "react";
import { useAuth } from "../src/auth";
import {
  disablePush,
  enablePush,
  notificationSwitches,
  pushUnavailableReason,
  setNotificationsEnabled,
} from "../src/push";
import { Page, Title, Hint } from "../src/ui/Page";
import { ErrorText, Row, Toggle } from "../src/ui/kit";
export default function Notifications() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const state = notificationSwitches(user);
  const reason = pushUnavailableReason();
  const change = async (key: "enabled" | "push", on: boolean) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setUser(
        key === "enabled"
          ? await setNotificationsEnabled(on)
          : on
            ? await enablePush()
            : await disablePush(state.enabled),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Уведомления">
      <Title>Уведомления</Title>
      <Hint>Выбери, какие события будут напоминать о себе.</Hint>
      <Row
        icon="notifications-outline"
        title="уведомления о лайках и сообщениях — подсказки в приложении"
        right={
          <Toggle
            value={state.enabled}
            disabled={busy}
            onValueChange={(v) => void change("enabled", v)}
          />
        }
      />
      <Row
        icon="phone-portrait-outline"
        title="пуш о лайках и сообщениях — и когда приложение закрыто"
        right={
          <Toggle
            value={state.push}
            disabled={busy || !state.enabled || !!reason}
            onValueChange={(v) => void change("push", v)}
          />
        }
      />
      {reason && <Hint>{reason}</Hint>}
      <ErrorText>{error}</ErrorText>
    </Page>
  );
}
