import { useEffect, useState } from "react";
import { endpoints } from "./api/client";
import type { Catalog } from "./api/types";
import { useLanguage, type Language } from "./i18n";

const cache = new Map<Language, Catalog>();
const pending = new Map<Language, Promise<Catalog>>();

/** Catalog labels depend on language; canonical ids and city values never change. */
export function useCatalog(): Catalog | null {
  const language = useLanguage();
  const [loaded, setLoaded] = useState<{ language: Language; catalog: Catalog } | null>(null);
  useEffect(() => {
    let active = true;
    if (!pending.has(language)) pending.set(language, endpoints.catalog(language).then(result => {
      cache.set(language, result);
      return result;
    }).catch(error => { pending.delete(language); throw error; }));
    void pending.get(language)!.then(result => { if (active) setLoaded({ language, catalog: result }); }).catch(() => undefined);
    return () => { active = false; };
  }, [language]);
  return loaded?.language === language ? loaded.catalog : cache.get(language) || null;
}
export function useTagLabel(): (id: string) => string {
  const catalog = useCatalog();
  return id => {
    for (const list of [catalog?.neuro, catalog?.vibe, catalog?.intents]) {
      const item = list?.find(item => item.id === id);
      if (item) return item.label || item.name || id;
    }
    return id;
  };
}
