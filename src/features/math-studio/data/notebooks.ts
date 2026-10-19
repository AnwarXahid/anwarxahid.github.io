export type Card = {
  id: string;
  kind: "equation" | "text" | "graph" | "scan";
  content: string;
  created: number;
};
export type Notebook = {
  id: string;
  name: string;
  cards: Card[];
  updated: number;
};
const database = "openmath-studio",
  version = 1,
  store = "notebooks";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(store))
        request.result.createObjectStore(store, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  act: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = act(tx.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function listNotebooks(): Promise<Notebook[]> {
  return (await transaction("readonly", (s) => s.getAll())) as Notebook[];
}
export async function saveNotebook(book: Notebook) {
  await transaction("readwrite", (s) => s.put(book));
}
export async function deleteNotebook(id: string) {
  await transaction("readwrite", (s) => s.delete(id));
}
export function validateNotebook(value: unknown): Notebook {
  if (!value || typeof value !== "object")
    throw new Error("Invalid notebook file.");
  const x = value as any;
  if (
    typeof x.id !== "string" ||
    typeof x.name !== "string" ||
    !Array.isArray(x.cards) ||
    x.cards.length > 500 ||
    x.name.length > 120
  )
    throw new Error("Invalid notebook structure.");
  const cards = x.cards.map((c: any) => {
    if (
      !c ||
      typeof c.id !== "string" ||
      !["equation", "text", "graph", "scan"].includes(c.kind) ||
      typeof c.content !== "string" ||
      c.content.length > 10000
    )
      throw new Error("Invalid notebook card.");
    return {
      id: c.id,
      kind: c.kind,
      content: c.content,
      created: Number(c.created) || Date.now(),
    };
  });
  return {
    id: x.id,
    name: x.name,
    cards,
    updated: Number(x.updated) || Date.now(),
  };
}
