import type { Assessment, Breakdown } from "./carbon";

const KEY_ID = "cc-anon-id";
const KEY_HISTORY = "cc-history";

export interface StoredEntry {
  assessment: Assessment;
  breakdown: Breakdown;
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY_ID);
  if (!id) {
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    id = `CC-${rand.padEnd(6, "X")}`;
    localStorage.setItem(KEY_ID, id);
  }
  return id;
}

export function getHistory(): StoredEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as StoredEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: StoredEntry) {
  if (typeof window === "undefined") return;


  const history = getHistory();

  const updatedHistory = [...history, entry];

  localStorage.setItem(
    KEY_HISTORY,
    JSON.stringify(updatedHistory)
  );
}
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_HISTORY);
}

export function latestEntry(): StoredEntry | null {
  const list = getHistory();
  return list.length ? list[list.length - 1] : null;
}
