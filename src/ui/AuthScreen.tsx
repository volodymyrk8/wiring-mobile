import { tr, useLanguage } from "../i18n";
import { consumeDestination } from "../routes";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { endpoints, ApiError } from "../api/client";
import { useAuth } from "../auth";
import { Button, ErrorText, Field } from "./kit";
import { Page, Title, Hint, Check } from "./Page";
import { SocialButtons } from "../features/auth/SocialButtons";
export function AuthScreen({
  mode,
}: {
  mode: "login" | "register" | "forgot" | "reset" | "verify";
}) {
  useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    token?: string;
    verify?: string;
    reset?: string;
    ref?: string;
  }>();
  const auth = useAuth();
  const { acceptSession } = auth;
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.email || "");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const token = params.token || params.verify || params.reset;
  useEffect(() => {
    if (mode !== "verify" || !token) return;
    let alive = true;
    endpoints
      .verify(token)
      .then(async (res) => {
        if (!alive) return;
        await acceptSession(res);
        router.replace(
          res.user.needs_profile
            ? "/edit-profile"
            : res.user.needs_onboard
              ? "/onboard"
              : "/(tabs)/feed",
        );
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [token, mode, acceptSession, router]);
  const submit = async () => {
    if (busy) return;
    setError("");
    if (
      mode !== "reset" &&
      mode !== "verify" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError(tr("Проверь правильность адреса почты"));
      return;
    }
    if (
      (mode === "login" || mode === "register" || mode === "reset") &&
      password.length < 6
    ) {
      setError(tr("Пароль должен содержать минимум 6 символов"));
      return;
    }
    if (
      mode === "register" &&
      (name.trim().length < 2 || name.trim().length > 32 || !adult || !privacy)
    ) {
      setError(tr("Укажи имя, подтверди 18+ и согласие с правилами"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await auth.login(email, password);
        router.replace((consumeDestination()||"/(tabs)/feed") as never);
      } else if (mode === "register") {
        const res = await auth.register(name, email, password, params.ref);
        router.replace(
          res.needsEmailVerify
            ? { pathname: "/verify", params: { email: res.email } }
            : "/edit-profile",
        );
      } else if (mode === "forgot") {
        await endpoints.forgot(email);
        setDone(true);
      } else if (mode === "reset") {
        if (!token) throw new Error(tr("Открой ссылку из письма"));
        await endpoints.resetPassword(token, password);
        setDone(true);
      } else {
        await endpoints.resend(email);
        setDone(true);
      }
    } catch (e) {
      if (e instanceof ApiError && e.payload.needs_email_verify) {
        router.push({
          pathname: "/verify",
          params: { email: e.payload.email || email },
        });
      } else
        setError(
          e instanceof Error ? e.message : tr("Не получилось, попробуй ещё раз"),
        );
    } finally {
      setBusy(false);
    }
  };
  const titles = {
    login: tr("Войти"),
    register: tr("Создать профиль"),
    forgot: tr("Забыли пароль"),
    reset: tr("Новый пароль"),
    verify: tr("Подтверди почту"),
  };
  return (
    <Page title={titles[mode]}>
      <View style={{ maxWidth: 390, width: "100%", alignSelf: "center" }}>
        <Title>{titles[mode]}</Title>
        {done ? (
          <>
            <Hint>
              {mode === "reset"
                ? tr("Пароль изменён. Войди с новым паролем.")
                : tr("Письмо отправлено. Проверь почту и папку «Спам».")}
            </Hint>
            <Button title={tr("Войти")} onPress={() => router.push("/login")} />
          </>
        ) : (
          <>
            {mode === "verify" && (
              <Hint>
                {tr("Мы отправили ссылку для подтверждения почты. Открой её на этом устройстве.")}</Hint>
            )}
            {mode === "register" && (
              <Field
                label={tr("Имя")}
                value={name}
                onChangeText={setName}
                maxLength={32}
                autoComplete="given-name"
              />
            )}
            {mode !== "reset" && (
              <Field
                label={tr("Почта")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
            {["login", "register", "reset"].includes(mode) && (
              <Field
                label={tr("Пароль")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            )}
            {mode === "register" && (
              <>
                <Check
                  checked={adult}
                  onChange={setAdult}
                  label={tr("Мне есть 18 лет")}
                />
                <Check
                  checked={privacy}
                  onChange={setPrivacy}
                  label={tr("Согласен(на) с правилами и политикой конфиденциальности")}
                />
              </>
            )}
            <ErrorText>{error}</ErrorText>
            <Button
              title={
                mode === "verify"
                  ? tr("Отправить письмо ещё раз")
                  : mode === "forgot"
                    ? tr("Отправить ссылку")
                    : titles[mode]
              }
              onPress={() => void submit()}
              busy={busy}
            />
            {(mode === "login" || mode === "register") && (
              <SocialButtons
                mode={mode}
                consent={adult && privacy}
                refCode={params.ref}
              />
            )}
          </>
        )}
        {mode === "login" && (
          <>
            <Button
              title={tr("Забыли пароль?")}
              kind="ghost"
              onPress={() => router.push("/forgot")}
            />
            <Button
              title={tr("Нет профиля? Создать профиль")}
              kind="ghost"
              onPress={() => router.push("/register")}
            />
          </>
        )}
        {mode === "register" && (
          <Button
            title={tr("Уже есть профиль? Войти")}
            kind="ghost"
            onPress={() => router.push("/login")}
          />
        )}
      </View>
    </Page>
  );
}
