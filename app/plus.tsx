import { tr, getLocale, useLanguage } from "../src/i18n";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Hint } from "../src/ui/Page";
import {
  Button,
  Card,
  ErrorText,
  Field,
  Row,
  SectionTitle,
  Toggle,
} from "../src/ui/kit";
export default function Plus() {
  useLanguage();
  const { user, setUser } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const perform = async (
    fn: () => Promise<{ user: NonNullable<typeof user> }>,
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fn();
      setUser(res.user);
      setNotice(tr("Сохранено"));
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не удалось сохранить"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="WIRING+">
      <Title>WIRING+</Title>
      <Hint>
        {tr("Спокойный и комфортный режим знакомств без лишней спешки и ограничений.")}</Hint>
      <Card>
        <SectionTitle>
          {user?.plus ? tr("WIRING+ включён") : tr("WIRING+ выключен")}
        </SectionTitle>
        <Hint>
          {user?.plus_until
            ? tr("Подписка заканчивается {0}", new Date(user.plus_until * 1000).toLocaleDateString(getLocale()))
            : tr("Спокойный режим: кто лайкнул, инкогнито, пауза, заметки и отложенные профили.")}
        </Hint>
        {user?.plus && (
          <>
            <Row
              icon="eye-off-outline"
              title={tr("инкогнито — меня не показывают, пока я сам не лайкну")}
              right={
                <Toggle
                  value={!!user.incognito}
                  disabled={busy}
                  onValueChange={(v) =>
                    void perform(() => endpoints.plus({ incognito: v }))
                  }
                />
              }
            />
            <Row
              icon="pause-outline"
              title={tr("пауза — временно скрыть анкету")}
              right={
                <Toggle
                  value={!!user.paused}
                  disabled={busy}
                  onValueChange={(v) =>
                    void perform(() => endpoints.plus({ paused: v }))
                  }
                />
              }
            />
          </>
        )}
        <Field
          label={tr("Промокод")}
          value={code}
          onChangeText={setCode}
          maxLength={24}
          autoCapitalize="characters"
        />
        <Button
          title={tr("Активировать")}
          disabled={!code.trim()}
          busy={busy}
          onPress={() => void perform(() => endpoints.redeem(code.trim()))}
        />
        <ErrorText>{error}</ErrorText>
        <Hint>{notice}</Hint>
      </Card>
      {[
        [
          tr("Видно, кто лайкнул"),
          tr("Открывай входящие симпатии и выбирай, кому ответить взаимностью."),
        ],
        [
          tr("Режим инкогнито"),
          tr("Твоя анкета видна только тем людям, которых ты лайкнул сам."),
        ],
        [
          tr("Пауза анкеты"),
          tr("Скрой себя из ленты на время отдыха — текущие переписки и мэтчи сохранятся."),
        ],
        [
          tr("Заметки и закладки"),
          tr("Оставляй личные пометки к профилям — их видишь только ты."),
        ],
      ].map(([title, text]) => (
        <Card key={title} style={{ marginTop: 12 }}>
          <SectionTitle>{title}</SectionTitle>
          <Hint>{text}</Hint>
        </Card>
      ))}
      {user?.ref_url && (
        <Card style={{ marginTop: 16 }}>
          <SectionTitle>{tr("Пригласи своих")}</SectionTitle>
          <Hint>
            {tr("По ссылке зарегистрируется человек — ещё ")}{user.ref_days || 30} {tr(" дней WIRING+ вам обоим. Уже привели: ")}{user.ref_count || 0}
          </Hint>
          <Field
            label={tr("Реферальная ссылка")}
            value={user.ref_url}
            editable={false}
          />
          <Button
            title={tr("Копировать")}
            kind="ghost"
            onPress={() =>
              void Clipboard.setStringAsync(user.ref_url!)
                .then(() => setNotice(tr("Ссылка скопирована")))
                .catch(() => setError(tr("Не удалось скопировать")))
            }
          />
        </Card>
      )}
    </Page>
  );
}
