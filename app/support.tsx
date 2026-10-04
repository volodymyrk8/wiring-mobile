import { useState } from "react";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Hint } from "../src/ui/Page";
import { Button, Field, ErrorText } from "../src/ui/kit";
export default function Support() {
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
      setError("напиши чуть подробнее (минимум 8 символов)");
      return;
    }
    setBusy(true);
    try {
      setNotice(
        (await endpoints.support(name.trim(), email.trim(), body.trim()))
          .notice || "отправили. ответим на почту, если её указал",
      );
      setBody("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="поддержка">
      <Title>Поддержка</Title>
      <Hint>
        Напиши сюда — это единственный способ связаться с нами. Почту в
        сообщении указывать не обязательно: если укажешь, ответим туда. Если ты
        в аккаунте, увидим, кто пишет.
      </Hint>
      {notice ? (
        <>
          <Title>Сообщение отправлено</Title>
          <Hint>{notice}</Hint>
          <Button
            title="Написать ещё одно сообщение"
            kind="ghost"
            onPress={() => setNotice("")}
          />
        </>
      ) : (
        <>
          <Field
            label="Имя (по желанию)"
            value={name}
            onChangeText={setName}
            maxLength={80}
          />
          <Field
            label="Почта для ответа (по желанию)"
            value={email}
            onChangeText={setEmail}
            maxLength={120}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Что случилось? Опиши подробно…"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            style={{ minHeight: 150, textAlignVertical: "top" }}
          />
          <Hint>Минимум 8 символов · {body.length} / 2000</Hint>
          <ErrorText>{error}</ErrorText>
          <Button
            title="Отправить сообщение"
            busy={busy}
            onPress={() => void send()}
          />
        </>
      )}
    </Page>
  );
}
