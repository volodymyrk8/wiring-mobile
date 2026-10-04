import { Platform, type ViewStyle } from "react-native";
import { usePrefs } from "./prefs";
import { themes } from "./themeTokens";
export { themes, THEME_LIST, type ThemeName } from "./themeTokens";
export type Theme = {
  [K in keyof typeof themes.mist]: K extends "isDark" ? boolean : string;
};
export const useTheme = (): Theme => themes[usePrefs().theme];
export const radius = { sm: 12, md: 14, lg: 26, pill: 999 };
export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08 * level,
      shadowRadius: 6 * level,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: level * 2 },
  }) as ViewStyle;
}
