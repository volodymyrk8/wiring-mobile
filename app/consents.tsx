import { tr, useLanguage } from "../src/i18n";
import { useState } from "react";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Check, Hint } from "../src/ui/Page";
import { Button, ErrorText } from "../src/ui/kit";
export default function Consents() {
  useLanguage();
  const { user, setUser } = useAuth();
  const [special, setSpecial] = useState(!user?.needs_special_consent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      setUser((await endpoints.consents(special)).user);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Не удалось сохранить"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title={tr("Согласия")}>
      <Title>{tr("Согласия")}</Title>
      <Check
        checked={special}
        onChange={setSpecial}
        label={tr("Согласен(на) на обработку и показ выбранных особенностей")}
      />
      <ErrorText>{error}</ErrorText>
      {saved && <Hint>{tr("Согласия сохранены")}</Hint>}
      <Button title={tr("Сохранить")} busy={busy} onPress={() => void save()} />
    </Page>
  );
}
