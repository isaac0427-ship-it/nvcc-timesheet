const KEY = "nvcc-print-history-v1";
const MAX = 50;

export interface HistoryEntry {
  id: string;
  label: string;
  studentName: string;
  periodLabel: string;
  generatedAt: string;
  count: number;
}

export function addHistory(entries: Array<{ studentName: string; periodLabel: string }>): void {
  if (!entries.length) return;
  const existing = getHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    label:
      entries.length === 1
        ? `${entries[0].studentName} — ${entries[0].periodLabel}`
        : `${entries.length} timesheets (${entries[0].studentName}…)`,
    studentName: entries[0].studentName,
    periodLabel: entries[0].periodLabel,
    generatedAt: new Date().toISOString(),
    count: entries.length,
  };
  existing.unshift(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(existing.slice(0, MAX)));
  } catch {
    // quota exceeded — drop oldest half
    localStorage.setItem(KEY, JSON.stringify(existing.slice(0, MAX / 2)));
  }
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}

export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
