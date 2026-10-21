import { useState } from "react";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../src/auth";
import { Page, Title, Hint } from "../src/ui/Page";
import { Button, ErrorText, Field } from "../src/ui/kit";
export default function Invite() {
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  return (
    <Page title="Приглашение">
      <Title>Анкета готова</Title>
      <Hint>
        Пригласи друга по ссылке — ещё {user?.ref_days || 30} дней WIRING+ будет
        и у тебя, и у него. Подарок за регистрацию, не за лайк.
      </Hint>
      {user?.ref_url ? (
        <>
          <Field label="Твоя ссылка" value={user.ref_url} editable={false} />
          <Button
            title={copied ? "Ссылка скопирована" : "Копировать"}
            kind="ghost"
            onPress={() =>
              void Clipboard.setStringAsync(user.ref_url!)
                .then(() => setCopied(true))
                .catch(() => setError("Не удалось скопировать"))
            }
          />
          <Hint>Ссылка всегда есть в профиле</Hint>
        </>
      ) : (
        <Hint>Ссылка для приглашений появится в профиле</Hint>
      )}
      <ErrorText>{error}</ErrorText>
      <Button title="В ленту" onPress={() => router.replace("/(tabs)/feed")} />
    </Page>
  );
}
