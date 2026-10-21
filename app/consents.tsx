import { useState } from "react";
import { useAuth } from "../src/auth";
import { endpoints } from "../src/api/client";
import { Page, Title, Check, Hint } from "../src/ui/Page";
import { Button, ErrorText } from "../src/ui/kit";
export default function Consents() {
  const { user, setUser } = useAuth();
  const [special, setSpecial] = useState(!user?.needs_special_consent);
  const [photo, setPhoto] = useState(!user?.needs_photo_consent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      setUser((await endpoints.consents(special, photo)).user);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Согласия">
      <Title>Согласия</Title>
      <Check
        checked={special}
        onChange={setSpecial}
        label="Согласен(на) на обработку и показ выбранных особенностей"
      />
      <Check
        checked={photo}
        onChange={setPhoto}
        label="Загружаю только свои фото и разрешаю показывать их участникам WIRING"
      />
      <ErrorText>{error}</ErrorText>
      {saved && <Hint>Согласия сохранены</Hint>}
      <Button title="Сохранить" busy={busy} onPress={() => void save()} />
    </Page>
  );
}
