export type Photo = string | { url: string; is_primary?: boolean; id?: number };

export type Person = {
  id: number;
  name: string;
  age?: number | string;
  city?: string;
  bio?: string;
  job?: string;
  photo?: string;
  photos?: Photo[];
  neuro?: string[];
  vibe?: string[];
  intents?: string[];
  online?: boolean;
  hidden?: boolean;
  communication?: string;
  height?: number | null;
  gender?: string;
  looking_for?: string;
  intent?: string;
  prompts?: { id: string; answer: string }[];
  recommendation_reasons?: string[];
  matched?: boolean;
  liked_you?: boolean;
  you_liked?: boolean;
  liked_at?: number;
};

export type Me = Person & {
  email: string;
  guest?: boolean;
  plus?: boolean;
  needs_profile?: boolean;
  needs_special_consent?: boolean;
  needs_photo_consent?: boolean;
  notify_enabled?: boolean;
  notify_push?: boolean;
  /** Unread chat messages and incoming likes, from /api/me. */
  unread?: number;
  likes_in?: number;
  /** Who can see my profile ("Кому показывать мою анкету"). */
  seek_min_age?: number;
  seek_max_age?: number;
  seek_place?: string;
  hide_tags?: string[];
  gender?: string;
  looking_for?: string;
  height?: number | null;
  needs_onboard?: boolean;
  incognito?: boolean;
  paused?: boolean;
  plus_until?: number;
  ref_url?: string;
  ref_days?: number;
  ref_count?: number;
  jev_feed_unlocked?: boolean;
  jev_feed_available?: boolean;
  jev_feed_enabled?: boolean;
};

export type FeedPage = {
  cards: Person[];
  has_more: boolean;
  generation?: number;
  recommendation_source?: "api" | "local";
};

export type Match = Person & {
  last_message?: string;
  last_at?: number;
  last_from_id?: number;
  unread?: number;
};

export type Message = {
  id: number;
  from_id: number;
  mine?: boolean;
  body?: string;
  photo_url?: string;
  audio_url?: string;
  transcript?: string;
  edited?: boolean;
  read?: boolean;
  audio_duration?: number;
  reply_to?: {
    id: number;
    body?: string;
    has_photo?: boolean;
    has_audio?: boolean;
    gone?: boolean;
    mine?: boolean;
  } | null;
  created_at: number;
};

export type Thread = { peer: Person; messages: Message[]; openers?: string[] };

export type CatalogItem = {
  id: string;
  label?: string;
  name?: string;
  hint?: string;
  tip?: string;
  expand?: string;
  blurb?: string;
};
export type Place = { country: string; cities: string[] };
export type Catalog = {
  neuro?: CatalogItem[];
  vibe?: CatalogItem[];
  intents?: CatalogItem[];
  genders?: CatalogItem[];
  looking_for?: CatalogItem[];
  places?: Place[];
  prompts?: CatalogItem[];
  report_reasons?: CatalogItem[];
  limits?: { photos: number; bio: number };
};

export type Archive = { likes: Person[]; passes: Person[]; blocks: Person[] };
export type Session = { access_token: string; refresh_token: string; user: Me };
