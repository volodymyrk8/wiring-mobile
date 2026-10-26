import { tr, useLanguage } from "../src/i18n";
import { useState } from "react";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Hint } from "../src/ui/Page";
import { Button, Field, ErrorText } from "../src/ui/kit";
export default function Support() {
  useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const send = async () => {
    if (busy) return;
    if (body.trim().length < 8) {
      setError(tr("напиши чуть подробнее (минимум 8 символов)"));
      return;
    }
    setBusy(true);
    try {
      setNotice(
        (await endpoints.support(name.trim(), email.trim(), body.trim()))
          .notice || tr("отправили. ответим на почту, если её указал"),
      );
      setBody("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не удалось отправить"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title={tr("поддержка")}>
      <Title>{tr("Поддержка")}</Title>
      <Hint>
        {tr("Напиши сюда — это единственный способ связаться с нами. Почту в сообщении указывать не обязательно: если укажешь, ответим туда. Если ты в аккаунте, увидим, кто пишет.")}</Hint>
      {notice ? (
        <>
          <Title>{tr("Сообщение отправлено")}</Title>
          <Hint>{notice}</Hint>
          <Button
            title={tr("Написать ещё одно сообщение")}
            kind="ghost"
            onPress={() => setNotice("")}
          />
        </>
      ) : (
        <>
          <Field
            label={tr("Имя (по желанию)")}
            value={name}
            onChangeText={setName}
            maxLength={80}
          />
          <Field
            label={tr("Почта для ответа (по желанию)")}
            value={email}
            onChangeText={setEmail}
            maxLength={120}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label={tr("Что случилось? Опиши подробно…")}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            style={{ minHeight: 150, textAlignVertical: "top" }}
          />
          <Hint>{tr("Минимум 8 символов · ")}{body.length} / 2000</Hint>
          <ErrorText>{error}</ErrorText>
          <Button
            title={tr("Отправить сообщение")}
            busy={busy}
            onPress={() => void send()}
          />
        </>
      )}
    </Page>
  );
}
