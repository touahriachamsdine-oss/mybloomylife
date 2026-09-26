# Psychologist Data Foundation — Design Spec

**Date:** 2026-09-26
**Status:** Awaiting review
**Phase:** 1 of 7 (see Roadmap)

---

## Problem

The psychologist role was asked for substantially more capability. Before adding
any of it, the data those features would read was audited, and the foundation
does not currently exist:

- `setCurrentMood` (`src/context/BloomContext.tsx:1498-1501`) writes a single
  scalar to `bloom_mood`. It records no history.
- `addMoodLog` (`:1355-1366`) *would* write a dated log, but it is called from
  **zero** call sites in the repo.
- Therefore `moodLogs` only ever contains the 4 hardcoded seeds at `:731-734`.
- Two of those seeds have `timestamp: "Yesterday"` and none have a `date`
  field, so they cannot be sorted, bucketed or trended. `AdminDashboardScreen.tsx:860`
  already calls `new Date(b.timestamp).getTime()` and gets `NaN`.
- The `useState` initializer at `:730` hardcodes the seeds instead of reading
  storage, so every load flashes fake data before `:881` replaces it.
- `LearningEntry` (`:262-267`) and `GratitudeEntry` (`:270-275`) have no
  `student` field, so a psychologist cannot attribute a journal entry to anyone.
- `PortfolioScreen.tsx:95` computes `moodDays` as
  `new Set(moodLogs.map(m => m.date ?? "")).size`. Because the seeds have no
  `date`, every one maps to `""`, so it always reports `1`.
- The parent fatigue alert (`:798-815`) intends "3+ negative moods in the last
  7 days" but computes `daysAgo` as `log.date ? ... : 0`. A missing `date`
  therefore resolves to `0`, i.e. *today*, so every negative mood is counted as
  current and the 7-day window does no windowing at all. It happens not to fire
  only because the seed counts stay under the threshold of 3.

The existing "Recent Mood Logs" and "Mood Trends" cards cannot improve, because
their input never grows. Any trend chart, early-warning alert or correlation
view built on top today would be drawing from an empty well.

**This phase makes the data real. It adds no new psychologist-facing screens.**

---

## Roadmap

This is phase 1 of a 7-phase programme to give the psychologist role real
clinical capability. Each phase gets its own spec and implementation plan; only
phase 1 is specified here.

| # | Phase | Depends on |
|---|---|---|
| 1 | **Data foundation** — mood becomes a real dated per-student log, journals get a student, shared hooks | — |
| 2 | Case management — structured session notes (date/type/author) + per-student timeline | 1 |
| 3 | Check-in scales — structured wellbeing instrument with score history | 1 |
| 4 | Risk triage — composite score, ranked dashboard, explained reasons | 1, 3 |
| 5 | Interventions — assign exercises to a student, track completion | 1 |
| 6 | Analytics & reports — real charts, correlation, printable case summary | 1–4 |
| 7 | Scheduling & messaging — appointment slots, psychologist↔student/parent threads | 1 |

Phases 3–6 all answer "how is this student doing?" by combining mood, grades,
attendance and check-ins. That logic must exist in exactly one place or the risk
dashboard and the analytics report will disagree. `useStudentMetrics` is that
one place, and this phase creates it.

---

## Goals

1. Every mood selection anywhere in the app appends a dated, per-student,
   sortable log entry.
2. Journal entries are attributable to a student.
3. Two reusable hooks exist — `useCaseload` and `useStudentMetrics` — that later
   phases extend instead of reimplementing.
4. Existing screens keep working in all four languages. Any changed
   student-facing string gets a new key in all four locales.

## Non-goals

- No new psychologist screens, tabs or nav entries.
- No charting. Phase 6.
- No assessments, interventions, appointments or messaging.
- No stable student IDs. See [Decisions](#decisions).

---

## Design

### 1. `MoodLog` becomes analyzable

Replace the unparseable locale string with one canonical ISO field.

```ts
export interface MoodLog {
  id: string;
  student: string;
  mood: string;
  at: string; // ISO 8601. Canonical: sortable and aggregatable.
}
```

`date` is removed as a stored field. Where a day bucket is needed, derive it as
`at.slice(0, 10)`. This removes the optional-field ambiguity that made
`PortfolioScreen.tsx:95` and the parent fatigue alerts silently no-op.

**Read sites to update:**

| File | Line | Change |
|---|---|---|
| `src/components/screens/PsychologicalScreen.tsx` | 266 | Renders `log.timestamp` raw. Format from `at` for display. |
| `src/components/screens/AdminDashboardScreen.tsx` | 859 | Filters "today's moods" via `m.date \|\| m.timestamp.slice(0, 10)`. Derive the day key from `at`. |
| `src/components/screens/AdminDashboardScreen.tsx` | 860 | `new Date(b.timestamp).getTime()` → parse `at`; the `NaN` sort starts working. |
| `src/components/screens/AdminDashboardScreen.tsx` | 861 | Inlines its own negative-mood list, duplicating `NEGATIVE_MOODS`. Reuse the shared constant. |
| `src/components/screens/PortfolioScreen.tsx` | 95 | `moodDays` count — derive day keys from `at`. |
| `src/context/BloomContext.tsx` | 800-815 | Parent fatigue alert window — derive from `at`; the `?? 0` fallback is the bug. |

### 2. The mood interaction records history

`setCurrentMood` becomes the single writer of mood history. It keeps its current
job (the "current mood" scalar for UI) and additionally appends a log entry.

It reuses the patterns already established by `requestHelp` (`:1322-1324`):

- student resolution: `currentUser?.name || "Sara"`
- id generation: `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`
- ISO timestamps

Two guards, because a child tapping an emoji repeatedly must not flood the
record:

- **Anti-spam window (5 minutes).** Skip the append if that student's most
  recent log has the same `mood` and an `at` within 5 minutes.
- **Cap (500 entries).** Keep the newest 500 after each append.

`addMoodLog` is removed. It is dead code with zero call sites, and after this
change `setCurrentMood` is the only path by which a mood log can exist. Keeping
both would leave two ways to write the same record.

### 3. Demo seeds become analyzable

The 4 hardcoded seeds at `:731-734` are replaced with generated entries that
carry real ISO `at` values spread across the preceding 7 days, covering the
existing demo students **Sara** and **Ahmed** and deliberately including
negative moods, so the existing Mood Trends card has something truthful to
render rather than four rows reading `"Yesterday"`.

The `useState` initializer moves to reading storage with a normalizer, so the
seed is only used when storage has nothing usable:

```ts
const [moodLogs, setMoodLogsState] = useState<MoodLog[]>(() => {
  const saved = bloomGetJson<MoodLog[] | null>(BLOOM_KEYS.moodLogs, null);
  return normalizeMoodLogs(saved);
});
```

`page.tsx:711-713` gates rendering on `bloomHydrateFromServer()` resolving, so
local storage is already hydrated when this initializer runs. Reading in the
initializer (rather than the mount effect at `:845`/`:881`) removes the flash of
fake data.

`normalizeMoodLogs` is a pure function: it drops any entry without a parseable
`at`, and returns the generated demo seed only when the result is empty. It is
idempotent, so it is safe to run on every load and needs no storage-version bump.

### 4. Journals are attributable

```ts
export interface LearningEntry {
  id: string;
  student: string; // new
  subject: string;
  text: string;
  emoji: string;
  date: string;
}

export interface GratitudeEntry {
  id: string;
  student: string; // new
  text: string;
  emoji: string;
  date: string;
}
```

Set from `currentUser?.name || "Sara"` in `LearningJournalScreen.tsx:19` and
`GratitudeScreen.tsx:18`. Entries arriving without a `student` (defensively, e.g.
from an imported snapshot) resolve to the active student at read time.

### 5. `src/hooks/useCaseload.ts`

The roster/caseload resolution is currently inlined at
`PsychologicalScreen.tsx:35-40` and duplicated in `ParentScreen`. This hook
becomes the single definition of "which students may this role see", driven by
`studentAssignments`.

- For a psychologist: assigned students, or all students when no assignment
  exists anywhere (preserves current fallback behaviour).
- For a parent: students linked via `linkedChildren`, or assigned.

Extracting this also means the existing `hasAnyPsyAssignment` fallback rule
lives in one place instead of being re-derived per screen.

### 6. `src/hooks/useStudentMetrics.ts`

The architectural centrepiece. Reads from `useBloom()` and returns per-student
aggregates. Phase 1 ships only what mood, grades and attendance can support;
phases 3–6 extend this file.

```ts
export interface MetricSignal {
  code: string;        // stable id, e.g. "mood_negative_7d"
  severity: "info" | "warn" | "alert";
  weight: number;      // contribution to the composite score
}

export interface StudentMetrics {
  student: string;
  moodCount: number;
  negativeMoodCount: number;   // last 7 days
  moodTrend: "improving" | "stable" | "worsening";
  dominantMood: string | null;
  averageGrade: number | null;
  attendanceRate: number | null; // last 30 days
  lastMoodAt: string | null;
  signals: MetricSignal[];       // why this student looks the way they do
}
```

`signals[]` is what makes the phase 4 risk dashboard explain itself rather than
displaying an unexplained number. Each signal carries a `code` so the UI can
localize its label from a single table rather than hardcoding strings.

Negative moods are the existing `NEGATIVE_MOODS` set (`:26`):
`mood_sad`, `mood_anxious`, `mood_angry`.

`moodTrend` compares the mean mood of the most recent 3 days against the
preceding 3, using a `mood_calm`/`mood_happy` = +1 and
`mood_sad`/`mood_anxious`/`mood_angry` = −1 polarity scale, and reports
`worsening`/`improving` only past a threshold of 0.5 so single-day noise does
not flip the label.

---

## Files

**New**
- `src/hooks/useCaseload.ts`
- `src/hooks/useStudentMetrics.ts`
- `src/lib/mood.ts` — `normalizeMoodLogs`, polarity scale, trend helper (pure, independently testable)

**Modified**
- `src/context/BloomContext.tsx` — `MoodLog` shape, `setCurrentMood` writer, `addMoodLog` removal, journal `student` fields, mood initializer, parent fatigue alert window
- `src/components/screens/PsychologicalScreen.tsx` — timestamp display, use `useCaseload`
- `src/components/screens/ParentScreen.tsx` — use `useCaseload`
- `src/components/screens/AdminDashboardScreen.tsx` — `at` sort
- `src/components/screens/PortfolioScreen.tsx` — mood-day count from `at`
- `src/components/screens/LearningJournalScreen.tsx` — stamp `student`
- `src/components/screens/GratitudeScreen.tsx` — stamp `student`
- `src/app/locales.json` — new keys for any changed student-facing strings, in `en`/`ar`/`fr`/`kab`

**Not modified:** `src/lib/storage.ts`. No new `BLOOM_KEYS` entry is needed
(`bloom_mood_logs` already exists) and no `STORAGE_VERSION` bump is needed,
because normalization happens at read time.

---

## Edge cases

- **Clock skew / future `at`.** Day-bucketing clamps to today, so a
  device with a wrong clock cannot push a log into a future window.
- **Unknown student in a log.** Metrics are computed per requested name, so an
  orphan log is simply never read. No crash, no leak.
- **Empty caseload.** `useCaseload` returns `[]`; every consumer already
  handles the empty case (`psy_caseload_empty`).
- **Student with no grades / no attendance.** `averageGrade` and
  `attendanceRate` are `null`, and metrics code must not coerce `null` to `0`.
  A student with no attendance record is not a student with 0% attendance.
- **Import of an old snapshot.** `normalizeMoodLogs` drops mood entries lacking
  `at`; journal entries lacking `student` fall back to the active student. Both
  are lossy by design, because no real pre-existing data can be lost (see
  [Decisions](#decisions)).

---

## Testing

No test framework exists in the repo, so this follows the established pattern:
standalone `.mjs` harnesses under
`C:\Users\anouar\AppData\Local\Temp\opencode\` that import the real modules with
`node --experimental-strip-types` and stub `localStorage`/`fetch`.

Required cases:

1. `normalizeMoodLogs` drops entries without a parseable `at`, is idempotent,
   and returns the demo seed only when input is empty.
2. Anti-spam window: two identical moods inside 5 minutes produce one entry;
   the same mood after 5 minutes produces two; a different mood immediately
   produces two.
3. Cap: appending past 500 keeps the newest 500.
4. `moodTrend` is `worsening` / `improving` / `stable` for hand-built fixtures,
   and does not flip on single-day noise.
5. `useStudentMetrics` returns `null` (not `0`) for absent grades/attendance.
6. The cap and window logic verified against the **old** implementation first, to
   prove the harness can actually fail.

Regression guard: `npm run build` must pass, and `npm run lint` must not exceed
the pre-existing baseline of **47 errors / 125 warnings**. Any new error is a
regression.

---

## Decisions

**Students stay keyed by display name.** Every student-keyed table in the app
already uses the display name as its key, and the roster is
`Object.keys(studentGrades)`. Migrating six new record types to stable IDs
would put the five currently-working roles at risk for a wart that is
pre-existing rather than introduced here. Revisit only if duplicate student
names become a real problem.

**No `STORAGE_VERSION` bump.** `runStorageMigrations` runs in a mount effect
(`BloomContext.tsx:834`), which React runs *after* the `useState` initializers
have already read storage. A migration that reshapes data would therefore not
affect the already-initialized state, and any write during that session would
overwrite the migrated data with the old shape. Read-time normalization is
order-independent and avoids the trap entirely.

**Old mood data is dropped rather than migrated.** `addMoodLog` was never
called, so every mood log that has ever existed is one of the 4 hardcoded
seeds. There is no real data to preserve, which is what makes the clean break in
`MoodLog` safe.

**The 5-minute window and 500-entry cap are judgment calls**, chosen to be
invisible to a real user while preventing accidental flooding. Neither is
derived from anything in the code; both are single constants and trivial to
change.

**Extending `useStudentMetrics` rather than growing `BloomContext`.**
`BloomContext.tsx` is already 1,715 lines. Six further feature areas of derived
analysis inside it would make it unmaintainable, and a pure module in `src/lib`
plus two hooks in `src/hooks` can be unit-tested without mounting a provider.
