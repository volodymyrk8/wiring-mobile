import type { Person } from "../../api/types";
export type FeedState = {
  excluded: number[];
  cards: Person[];
  index: number;
  hasMore: boolean;
  generation: number;
  source?: "api" | "local";
};
export const initialFeed = (): FeedState => ({
  excluded: [],
  cards: [],
  index: 0,
  hasMore: true,
  generation: 0,
});
export function appendFeed(
  state: FeedState,
  page: {
    cards: Person[];
    has_more: boolean;
    generation?: number;
    recommendation_source?: "api" | "local";
  },
): FeedState {
  const ids = new Set([...state.excluded, ...state.cards.map((c) => c.id)]);
  return {
    ...state,
    cards: [
      ...state.cards,
      ...page.cards.filter((c) => {
        if (ids.has(c.id)) return false;
        ids.add(c.id);
        return true;
      }),
    ],
    hasMore: page.has_more,
    generation: page.generation ?? state.generation,
    source: page.recommendation_source,
  };
}
export function removePerson(state: FeedState, id: number): FeedState {
  const at = state.cards.findIndex((c) => c.id === id);
  if (at < 0)
    return { ...state, excluded: [...new Set([...state.excluded, id])] };
  const cards = state.cards.filter((c) => c.id !== id);
  return {
    ...state,
    excluded: [...new Set([...state.excluded, id])],
    cards,
    index: Math.min(
      Math.max(0, state.index - (at < state.index ? 1 : 0)),
      Math.max(0, cards.length - 1),
    ),
  };
}
