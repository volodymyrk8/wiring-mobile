import { useSyncExternalStore } from "react";
import { initialFeed, removePerson, type FeedState } from "./state";
const feeds = new Map<string, FeedState>();
const listeners = new Set<() => void>();
export const getFeed = (key: string) => {
  if (!feeds.has(key)) feeds.set(key, initialFeed());
  return feeds.get(key)!;
};
export const setFeed = (key: string, state: FeedState) => {
  feeds.set(key, state);
  listeners.forEach((fn) => fn());
};
export const removeFromFeeds = (id: number) => {
  for (const [key, state] of feeds) feeds.set(key, removePerson(state, id));
  listeners.forEach((fn) => fn());
};
export const clearFeeds = () => {
  feeds.clear();
  listeners.forEach((fn) => fn());
};
export const useFeed = (key: string) =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => getFeed(key),
  );
