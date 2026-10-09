export type BackendKind = "indexeddb" | "localstorage" | "memory";

/** A string key-value store. Every method may reject; callers must catch. */
export interface KvBackend {
  readonly kind: BackendKind;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const DATABASE_NAME = "whichai";
const STORE_NAME = "kv";
const OPEN_TIMEOUT_MS = 3000;
const KEY_PREFIX = "whichai:";

export function createMemoryBackend(): KvBackend {
  const values = new Map<string, string>();
  return {
    kind: "memory",
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  };
}

export function createLocalStorageBackend(storage: Storage): KvBackend {
  return {
    kind: "localstorage",
    get: async (key) => storage.getItem(KEY_PREFIX + key),
    set: async (key, value) => storage.setItem(KEY_PREFIX + key, value),
    remove: async (key) => storage.removeItem(KEY_PREFIX + key),
  };
}

function request<T>(source: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    source.onsuccess = () => resolve(source.result);
    source.onerror = () => reject(source.error);
  });
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("IndexedDB open timed out")),
      OPEN_TIMEOUT_MS,
    );
    const opening = factory.open(DATABASE_NAME, 1);
    opening.onupgradeneeded = () => {
      opening.result.createObjectStore(STORE_NAME);
    };
    opening.onsuccess = () => {
      clearTimeout(timer);
      resolve(opening.result);
    };
    opening.onerror = opening.onblocked = () => {
      clearTimeout(timer);
      reject(opening.error ?? new Error("IndexedDB blocked"));
    };
  });
}

export async function createIndexedDbBackend(
  factory: IDBFactory,
): Promise<KvBackend> {
  const database = await openDatabase(factory);
  const objectStore = (mode: IDBTransactionMode) =>
    database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  return {
    kind: "indexeddb",
    get: async (key) =>
      ((await request(objectStore("readonly").get(key))) as
        string | undefined) ?? null,
    set: async (key, value) => {
      await request(objectStore("readwrite").put(value, key));
    },
    remove: async (key) => {
      await request(objectStore("readwrite").delete(key));
    },
  };
}

function probeLocalStorage(storage: Storage): void {
  const key = `${KEY_PREFIX}probe`;
  storage.setItem(key, "1");
  storage.removeItem(key);
}

/**
 * IndexedDB first, then localStorage, then memory. Memory means nothing
 * survives the page, which callers report as "storage unavailable".
 */
export async function openBackend(): Promise<KvBackend> {
  try {
    return await createIndexedDbBackend(indexedDB);
  } catch {
    // Blocked or missing; try the next option.
  }
  try {
    probeLocalStorage(localStorage);
    return createLocalStorageBackend(localStorage);
  } catch {
    return createMemoryBackend();
  }
}
