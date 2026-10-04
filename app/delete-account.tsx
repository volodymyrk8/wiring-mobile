import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Hint, Check, Confirm } from "../src/ui/Page";
import { Button, Field, ErrorText } from "../src/ui/kit";
export default function DeleteAccount() {
  const { logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    setBusy(true);
    try {
      await endpoints.deleteAccount(password);
      await logout();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="удаление">
      <Title>Удаление аккаунта</Title>
      <Hint>
        Профиль сразу пропадёт из публичного доступа: ты исчезнешь из ленты,
        поиска и чатов. Восстановить профиль можно в течение 7 суток входом с
        тем же паролем. После этого данные удалятся полностью.
      </Hint>
      <Hint>
        Если зарегистрировались через Google или Яндекс, сначала задайте пароль
        через сброс пароля.
      </Hint>
      <Button
        title="Задать пароль через сброс пароля"
        kind="ghost"
        onPress={() => router.push("/forgot")}
      />
      <Field
        label="Текущий пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Check
        checked={checked}
        onChange={setChecked}
        label="Подтверждаю удаление своего профиля"
      />
      <ErrorText>{error}</ErrorText>
      <Button
        title="Удалить аккаунт навсегда"
        kind="danger"
        disabled={!password || !checked}
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Confirm
          title="Удалить аккаунт?"
          body="Анкета сразу скроется. В течение 7 суток её можно восстановить."
          label="Удалить"
          busy={busy}
          onConfirm={() => void remove()}
          onClose={() => !busy && setConfirm(false)}
        />
      )}
    </Page>
  );
}
