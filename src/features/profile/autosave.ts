export type SaveState = {
  phase: "idle" | "waiting" | "saving" | "saved" | "error";
  local: boolean;
  error: string;
};
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};
const requests = new Map<string, Promise<unknown>>();
const writes = new Map<string, Promise<unknown>>();
function enqueue<R>(
  queue: Map<string, Promise<unknown>>,
  key: string,
  fn: () => Promise<R>,
): Promise<R> {
  const next = (queue.get(key) || Promise.resolve()).catch(() => {}).then(fn);
  queue.set(key, next);
  void next
    .finally(() => {
      if (queue.get(key) === next) queue.delete(key);
    })
    .catch(() => {});
  return next;
}
export function createAutosave<T, R>(opts: {
  key: string;
  initial: T;
  restored: boolean;
  storage: Storage;
  save: (value: T, publish: boolean) => Promise<R>;
  onSaved: (r: R) => void;
  onState: (s: SaveState) => void;
  delay?: number;
}) {
  let value = opts.initial,
    revision = 0,
    saved = opts.restored ? -1 : 0,
    disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending:
    | { version: number; publish: boolean; promise: Promise<R | undefined> }
    | undefined;
  let state: SaveState = {
    phase: opts.restored ? "waiting" : "idle",
    local: opts.restored,
    error: "",
  };
  const emit = (patch: Partial<SaveState>) => {
    state = { ...state, ...patch };
    if (!disposed) opts.onState(state);
  };
  const persist = () => {
    const snapshot = JSON.stringify(value),
      v = revision;
    return enqueue(writes, opts.key, () =>
      opts.storage.setItem(opts.key, snapshot),
    ).then(
      () => {
        if (v === revision) emit({ local: true });
      },
      () => {
        if (v === revision) emit({ local: false });
      },
    );
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!disposed && revision !== saved)
      timer = setTimeout(() => void save().catch(() => {}), opts.delay ?? 1400);
  };
  const save = (publish = false): Promise<R | undefined> => {
    clearTimeout(timer);
    if (disposed || (!publish && revision === saved))
      return Promise.resolve(undefined);
    if (pending?.version === revision && pending.publish === publish)
      return pending.promise;
    const snapshot = value,
      v = revision;
    emit({ phase: "saving", error: "" });
    const promise = enqueue(requests, opts.key, async () => {
      if (disposed || (!publish && v !== revision)) return undefined;
      try {
        await persist();
        const response = await opts.save(snapshot, publish);
        if (disposed) return response;
        if (v === revision) {
          saved = v;
          await enqueue(writes, opts.key, async () => {
            if (
              (await opts.storage.getItem(opts.key)) ===
              JSON.stringify(snapshot)
            )
              await opts.storage.removeItem(opts.key);
          });
          emit({ phase: "saved", local: false, error: "" });
          opts.onSaved(response);
        }
        return response;
      } catch (e) {
        if (!disposed && v === revision)
          emit({
            phase: "error",
            error: e instanceof Error ? e.message : "Не удалось сохранить",
          });
        throw e;
      }
    });
    pending = { version: v, publish, promise };
    void promise
      .finally(() => {
        if (pending?.promise === promise) pending = undefined;
      })
      .catch(() => {});
    return promise;
  };
  return {
    get value() {
      return value;
    },
    start() {
      schedule();
    },
    update(next: T) {
      if (disposed || JSON.stringify(next) === JSON.stringify(value)) return;
      value = next;
      revision++;
      emit({ phase: "waiting", error: "" });
      void persist();
      schedule();
    },
    save,
    dispose() {
      disposed = true;
      clearTimeout(timer);
    },
  };
}
