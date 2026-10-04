import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { Page, Title } from "./Page";
import { Text, fonts } from "./Typography";
import { useTheme } from "../theme";
type Block = { type: string; parts: { text: string; href?: string }[] };
export function LegalScreen({
  title,
  blocks,
}: {
  title: string;
  blocks: Block[];
}) {
  const t = useTheme();
  const router = useRouter();
  return (
    <Page title={title}>
      <Title>{title}</Title>
      {blocks.map((b, i) => (
        <Text
          key={i}
          accessibilityRole={b.type.startsWith("h") ? "header" : undefined}
          style={{
            color: t.text,
            fontSize: b.type.startsWith("h") ? 22 : 15,
            lineHeight: b.type.startsWith("h") ? 28 : 23,
            fontFamily: b.type.startsWith("h") ? fonts.serif : fonts.body,
            marginTop: b.type.startsWith("h") ? 18 : 0,
            marginBottom: 12,
            paddingLeft: b.type === "li" ? 12 : 0,
          }}
        >
          {b.type === "li" ? "• " : ""}
          {b.parts.map((p, j) => (
            <Text
              key={j}
              accessibilityRole={p.href ? "link" : undefined}
              onPress={
                p.href
                  ? () =>
                      p.href!.startsWith("/")
                        ? router.push(p.href as never)
                        : void Linking.openURL(p.href!)
                  : undefined
              }
              style={
                p.href
                  ? { color: t.accent, textDecorationLine: "underline" }
                  : undefined
              }
            >
              {p.text}
            </Text>
          ))}
        </Text>
      ))}
    </Page>
  );
}
