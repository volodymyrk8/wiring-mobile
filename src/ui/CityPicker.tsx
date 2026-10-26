import { tr, useLanguage } from "../i18n";
import { Text } from "./Typography";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Field } from "./kit";

export function CityPicker({
  visible,
  places,
  onClose,
  onPick,
  allowAny,
  anyLabel = tr("Любой город"),
  includeCountries,
  title = tr("Город"),
}: {
  visible: boolean;
  places: { country: string; cities: string[] }[];
  onClose: () => void;
  onPick: (city: string) => void;
  allowAny?: boolean;
  anyLabel?: string;
  includeCountries?: boolean;
  title?: string;
}) {
  useLanguage();
  const t = useTheme();
  const [q, setQ] = useState("");
  const rows = (() => {
    const flat = places.flatMap((p) => [
      ...(includeCountries ? [{ city: p.country, country: tr("вся страна") }] : []),
      ...p.cities.map((c) => ({ city: c, country: p.country })),
    ]);
    const needle = q.trim().toLowerCase();
    return (
      needle
        ? flat.filter(
            (r) =>
              [r.city, tr(r.city)].some(value => value.toLowerCase().includes(needle)) ||
              [r.country, tr(r.country)].some(value => value.toLowerCase().includes(needle)),
          )
        : flat
    ).slice(0, 80);
  })();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: t.text, fontSize: 20, fontWeight: "800" }}>
              {title}
            </Text>
            <Pressable onPress={onClose} accessibilityLabel={tr("Закрыть")}>
              <Ionicons name="close" size={26} color={t.text} />
            </Pressable>
          </View>
          <Field
            label={tr("Поиск")}
            icon="search"
            value={q}
            onChangeText={setQ}
            autoFocus
          />
        </View>
        {allowAny && (
          <Pressable
            onPress={() => onPick("")}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <Text style={{ color: t.accent, fontSize: 17, fontWeight: "700" }}>
              {anyLabel}
            </Text>
          </Pressable>
        )}
        <FlatList
          data={rows}
          keyExtractor={(r) => `${r.country}-${r.city}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item.city)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: t.border,
              }}
            >
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "600" }}>
                {tr(item.city)}
              </Text>
              <Text style={{ color: t.muted, fontSize: 13 }}>
                {tr(item.country)}
              </Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
