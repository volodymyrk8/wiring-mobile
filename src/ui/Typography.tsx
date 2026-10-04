import { Text as NativeText, StyleSheet, type TextProps } from "react-native";
export const fonts = {
  body: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  bold: "IBMPlexSans_600SemiBold",
  serif: "Fraunces_500Medium",
  serifBold: "Fraunces_700Bold",
};
export function Text({ style, ...props }: TextProps) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  const family =
    weight && Number(weight) >= 600
      ? fonts.bold
      : weight === "500"
        ? fonts.medium
        : fonts.body;
  return <NativeText {...props} style={[{ fontFamily: family }, style]} />;
}
