import { useEffect, useState } from "react";
import { View } from "react-native";
import { api } from "../../api/client";
import { Button, ErrorText } from "../../ui/kit";
import { useAuth } from "../../auth";
import { useRouter } from "expo-router";
import { socialLogin } from "./social";
export function SocialButtons({
  mode,
  consent,
  refCode,
}: {
  mode: "login" | "register";
  consent: boolean;
  refCode?: string;
}) {
  const [providers, setProviders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { acceptSession } = useAuth();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    api<{ providers: string[] }>("/api/auth/providers")
      .then((r) => active && setProviders(r.providers))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const start = async (provider: string) => {
    if (busy) return;
    if (mode === "register" && !consent) {
      setError("Подтверди 18+ и согласие с правилами");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await socialLogin(provider, mode, refCode);
      if (!session) return;
      await acceptSession(session);
      router.replace(
        session.user.needs_profile
          ? "/edit-profile"
          : session.user.needs_onboard
            ? "/onboard"
            : "/(tabs)/feed",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {providers.map((p) => (
        <Button
          key={p}
          title={`${mode === "register" ? "Зарегистрироваться" : "Войти"} через ${p === "google" ? "Google" : "Яндекс"}`}
          kind="ghost"
          disabled={busy}
          onPress={() => void start(p)}
        />
      ))}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
