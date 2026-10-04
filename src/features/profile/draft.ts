import type { Me } from "../../api/types";
export type Draft = {
  name: string;
  age: string;
  gender: string;
  looking_for: string;
  city: string;
  job: string;
  bio: string;
  height: string;
  communication: string;
  neuro: string[];
  vibe: string[];
  intents: string[];
  prompts: { id: string; answer: string }[];
  special_data_consent: boolean;
  photo_rights_consent: boolean;
};
export function profileDraft(u: Me): Draft {
  return {
    name: u.name || "",
    age: u.age ? String(u.age) : "",
    gender: u.gender || "",
    looking_for: u.looking_for || "",
    city: u.city && u.city !== "—" ? u.city : "",
    job: u.job || "",
    bio: u.bio || "",
    height: u.height ? String(u.height) : "",
    communication: u.communication || "",
    neuro: u.neuro || [],
    vibe: u.vibe || [],
    intents: u.intents?.length ? u.intents : ["dating"],
    prompts: u.prompts || [],
    special_data_consent: !u.needs_special_consent,
    photo_rights_consent: !u.needs_photo_consent,
  };
}
export function profilePayload(d: Draft, publish: boolean) {
  return {
    ...d,
    name: d.name.trim(),
    age: Number(d.age) || null,
    height: d.height ? Number(d.height) : null,
    draft: !publish,
  };
}
export function restoreDraft(raw: string | null, initial: Draft): Draft {
  if (!raw) return initial;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return initial;
    const next = { ...initial };
    for (const key of Object.keys(initial) as (keyof Draft)[]) {
      if (
        typeof value[key] === typeof initial[key] &&
        Array.isArray(value[key]) === Array.isArray(initial[key])
      )
        Object.assign(next, { [key]: value[key] });
    }
    for (const key of ["neuro", "vibe", "intents"] as const)
      next[key] = next[key].filter((v) => typeof v === "string");
    next.prompts = next.prompts
      .filter(
        (p) => p && typeof p.id === "string" && typeof p.answer === "string",
      )
      .slice(0, 3);
    return next;
  } catch {
    return initial;
  }
}
