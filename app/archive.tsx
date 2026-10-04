import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { endpoints } from "../src/api/client";
import type { Archive, Person } from "../src/api/types";
import { clearFeeds } from "../src/features/feed/store";
import { Page, Title, Hint, Confirm } from "../src/ui/Page";
import { Button, ErrorText, Row, SectionTitle } from "../src/ui/kit";
const copy = {
  unlike: [
    "Убрать лайк?",
    "Анкета снова сможет попасть в ленту.",
    "Убрать лайк",
  ],
  restore: [
    "Вернуть в ленту?",
    "Дизлайк снимется, и анкета снова сможет попасться.",
    "Вернуть",
  ],
  unblock: [
    "Разблокировать?",
    "Блок снимется. В ленту анкета сама не вернётся — она останется в дизлайках, пока ты не вернёшь её отдельно.",
    "Разблокировать",
  ],
  unmatch: [
    "Убрать из чатов?",
    "Переписка скроется. Анкета уйдёт в дизлайки и не появится в ленте, пока ты сам её не вернёшь.",
    "Убрать из чатов",
  ],
};
export default function Decisions() {
  const router = useRouter();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{
    person: Person;
    action: keyof typeof copy;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    endpoints
      .archive()
      .then((r) => alive && setArchive(r))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  const apply = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      setArchive(await endpoints.revise(pending.person.id, pending.action));
      clearFeeds();
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="решения">
      <Title>Лайки, дизлайки и блок</Title>
      <Hint>
        Сюда можно зайти, когда хочется передумать. В ленте и чатах этого списка
        нет.
      </Hint>
      <ErrorText>{error}</ErrorText>
      {!archive ? (
        <Hint>Загружаем…</Hint>
      ) : (
        (
          Object.keys(archive).filter((k) =>
            ["likes", "passes", "blocks"].includes(k),
          ) as (keyof Archive)[]
        ).map((key) => (
          <Section
            key={key}
            title={{ likes: "Лайки", passes: "Дизлайки", blocks: "Блок" }[key]}
            people={archive[key]}
            onOpen={(p) => router.push(`/person/${p.id}`)}
            onAction={(p) =>
              setPending({
                person: p,
                action:
                  key === "blocks"
                    ? "unblock"
                    : key === "passes"
                      ? "restore"
                      : p.matched
                        ? "unmatch"
                        : "unlike",
              })
            }
            actionLabel={
              key === "blocks"
                ? "Разблокировать"
                : key === "passes"
                  ? "Вернуть"
                  : "Убрать"
            }
          />
        ))
      )}
      {pending && (
        <Confirm
          title={copy[pending.action][0]}
          body={copy[pending.action][1]}
          label={copy[pending.action][2]}
          busy={busy}
          onConfirm={() => void apply()}
          onClose={() => !busy && setPending(null)}
        />
      )}
    </Page>
  );
}
function Section({
  title,
  people,
  onOpen,
  onAction,
  actionLabel,
}: {
  title: string;
  people: Person[];
  onOpen: (p: Person) => void;
  onAction: (p: Person) => void;
  actionLabel: string;
}) {
  return (
    <>
      <SectionTitle>
        {title} · {people.length}
      </SectionTitle>
      {!people.length && <Hint>Пока никого.</Hint>}
      {people.map((p) => (
        <Row
          key={p.id}
          icon="person-outline"
          title={`${p.name}${p.age ? `, ${p.age}` : ""}`}
          subtitle={p.city}
          onPress={() => onOpen(p)}
          right={
            <Button
              title={actionLabel}
              kind="ghost"
              onPress={() => onAction(p)}
            />
          }
        />
      ))}
    </>
  );
}
