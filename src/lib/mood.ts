/**
 * Pure mood-log logic.
 *
 * Every function here is side-effect free and independently testable, so the
 * numbers a psychologist sees can be verified without mounting the provider.
 * This module never fabricates data: unknown input yields an empty result or a
 * neutral value, never a plausible-looking placeholder.
 *
 * The historical bug this exists to prevent: `MoodLog` used to carry a locale
 * time string ("10:30 AM", "Yesterday") instead of a timestamp, so nothing could
 * be sorted, bucketed or windowed, and a missing date silently resolved to
 * "today".
 */

export const NEGATIVE_MOODS = ["mood_sad", "mood_anxious", "mood_angry"] as const;

/** Mood polarity on a -1..+1 scale, used for trend and triage scoring. */
export const MOOD_POLARITY: Record<string, number> = {
  mood_happy: 1,
  mood_calm: 1,
  mood_sad: -1,
  mood_anxious: -1,
  mood_angry: -1,
};

/** Moods that count toward a parent/psychologist fatigue concern. */
export function isNegativeMood(mood: string): boolean {
  return (NEGATIVE_MOODS as readonly string[]).includes(mood);
}

/** Canonical shape of a mood log. `at` is ISO 8601 and always present. */
export interface MoodLog {
  id: string;
  student: string;
  mood: string;
  at: string;
}

/**
 * Coerce stored/imported/legacy data into the canonical shape.
 *
 * Drops any entry without a parseable `at`, because the old locale-string
 * timestamps carry no usable time information. Never invents an entry: an
 * empty or unusable input yields `[]`.
 */
export function normalizeMoodLogs(raw: unknown): MoodLog[] {
  if (!Array.isArray(raw)) return [];
  const out: MoodLog[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== "string" || typeof e.student !== "string") continue;
    if (typeof e.mood !== "string") continue;
    const at = typeof e.at === "string" ? e.at : "";
    if (!at || Number.isNaN(Date.parse(at))) continue;
    out.push({ id: e.id, student: e.student, mood: e.mood, at });
  }
  return out;
}

/**
 * Coerce stored/imported/legacy journal entries into the canonical shape.
 *
 * Entries without a parseable `at` or without an author are dropped. The
 * journal previously had neither field, so entries could not be sorted and
 * could not be attributed to a child - which is how one parent's view came to
 * include another child's journal.
 */
export function normalizeJournalEntries<T extends { id: string; student: string; at: string }>(
  raw: unknown
): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== "string" || typeof e.student !== "string" || !e.student) continue;
    const at = typeof e.at === "string" ? e.at : "";
    if (!at || Number.isNaN(Date.parse(at))) continue;
    out.push({ ...(e as unknown as T), id: e.id, student: e.student, at });
  }
  return out;
}

/** `YYYY-MM-DD` for an ISO timestamp, or null when unparseable. */
export function dayKey(at: string): string | null {
  if (!at) return null;
  const ms = Date.parse(at);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days between an ISO timestamp and `now`, floored at 0. */
function daysAgo(at: string, now: number): number | null {
  const ms = Date.parse(at);
  if (Number.isNaN(ms)) return null;
  return Math.floor((now - ms) / 86_400_000);
}

/**
 * Whether a new mood selection is worth recording.
 *
 * A child tapping an emoji repeatedly must not manufacture a trend, so an
 * identical mood from the same student inside the window is ignored.
 */
export function shouldLogMood(
  existing: MoodLog[],
  student: string,
  mood: string,
  now: number,
  windowMs = 5 * 60 * 1000
): boolean {
  const mine = existing.filter((l) => l.student === student);
  if (mine.length === 0) return true;
  const last = mine[0];
  if (last.mood !== mood) return true;
  const lastMs = Date.parse(last.at);
  if (Number.isNaN(lastMs)) return true;
  return now - lastMs >= windowMs;
}

/** Append one entry, keeping the newest `cap` records. */
export function appendMoodLog(
  existing: MoodLog[],
  student: string,
  mood: string,
  now: number,
  cap = 500
): MoodLog[] {
  const entry: MoodLog = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 6),
    student,
    mood,
    at: new Date(now).toISOString(),
  };
  return [entry, ...existing].slice(0, cap);
}

/** Mean polarity of a student's logged moods; 0 when there is nothing to read. */
export function averageMoodPolarity(logs: MoodLog[], now: number): number {
  const days: number[] = [];
  for (const l of logs) {
    const d = daysAgo(l.at, now);
    if (d !== null && d <= 7) days.push(MOOD_POLARITY[l.mood] ?? 0);
  }
  if (days.length === 0) return 0;
  return days.reduce((a, b) => a + b, 0) / days.length;
}

/**
 * Minimum mean-polarity shift before a trend is declared.
 *
 * A single day inside a 3-day bucket shifts that bucket's mean by 2/3, so a
 * threshold of 0.5 would label one bad day as "worsening" - exactly the false
 * alarm this is meant to avoid. 0.75 requires roughly two of three days to
 * move before anything is reported.
 *
 * The bias is deliberate: under-reporting a trend costs a clinician one more
 * look, while a noisy early-warning signal costs them trust in the whole
 * feature. With sparse logging, a genuine but gradual shift is more likely to
 * be missed than a single bad day is to be missed.
 */
export const MOOD_TREND_THRESHOLD = 0.75;

/**
 * Compare the most recent 3 days of mood against the 3 before that.
 *
 * A day with no usable timestamp cannot describe a trend and is skipped, as is
 * a future-dated entry from a device with a wrong clock.
 */
export function moodTrend(
  logs: MoodLog[],
  now: number,
  student?: string
): "improving" | "stable" | "worsening" {
  const recent: number[] = [];
  const previous: number[] = [];
  for (const l of logs) {
    if (student && l.student !== student) continue;
    const d = daysAgo(l.at, now);
    if (d === null) continue;
    if (d < 0) continue; // a future timestamp cannot describe a trend
    const p = MOOD_POLARITY[l.mood] ?? 0;
    if (d <= 2) recent.push(p);
    else if (d <= 5) previous.push(p);
  }
  if (recent.length === 0 || previous.length === 0) return "stable";
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = mean(recent) - mean(previous);
  if (delta <= -MOOD_TREND_THRESHOLD) return "worsening";
  if (delta >= MOOD_TREND_THRESHOLD) return "improving";
  return "stable";
}

/**
 * Negative moods for one student inside a rolling day window.
 *
 * The previous implementation resolved a missing date to zero days ago, so the
 * window did no windowing and every stale log counted as current. Unparseable
 * entries are now ignored rather than assumed to be today.
 */
export function negativeMoodCountInWindow(
  logs: MoodLog[],
  student: string,
  windowDays = 7,
  now: number = Date.now()
): number {
  let count = 0;
  for (const l of logs) {
    if (l.student !== student || !isNegativeMood(l.mood)) continue;
    const d = daysAgo(l.at, now);
    if (d !== null && d >= 0 && d <= windowDays) count++;
  }
  return count;
}
