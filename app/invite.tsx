import { tr, useLanguage } from "../src/i18n";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../src/auth";
import { Page, Title, Hint } from "../src/ui/Page";
import { Button, ErrorText, Field } from "../src/ui/kit";
export default function Invite() {
  useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  return (
    <Page title={tr("Приглашение")}>
      <Title>{tr("Анкета готова")}</Title>
      <Hint>
        {tr("Пригласи друга по ссылке — ещё ")}{user?.ref_days || 30} {tr(" дней WIRING+ будет и у тебя, и у него. Подарок за регистрацию, не за лайк.")}</Hint>
      {user?.ref_url ? (
        <>
          <Field label={tr("Твоя ссылка")} value={user.ref_url} editable={false} />
          <Button
            title={copied ? tr("Ссылка скопирована") : tr("Копировать")}
            kind="ghost"
            onPress={() =>
              void Clipboard.setStringAsync(user.ref_url!)
                .then(() => setCopied(true))
                .catch(() => setError(tr("Не удалось скопировать")))
            }
          />
          <Hint>{tr("Ссылка всегда есть в профиле")}</Hint>
        </>
      ) : (
        <Hint>{tr("Ссылка для приглашений появится в профиле")}</Hint>
      )}
      <ErrorText>{error}</ErrorText>
      <Button title={tr("В ленту")} onPress={() => router.replace("/(tabs)/feed")} />
    </Page>
  );
}
