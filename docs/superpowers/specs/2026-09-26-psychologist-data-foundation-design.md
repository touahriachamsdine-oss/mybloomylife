# Psychologist Programme — Design Spec

**Date:** 2026-09-26
**Status:** Awaiting review
**Scope:** Phase 0 (integrity) + Phase 1 (data foundation); roadmap covers 0–7

> **Revised 2026-09-26.** Originally this document specified phase 1 only. A
> follow-up audit of fabricated, dead and no-op behaviour found **64 issues, 37
> of them actively misleading** — including a fabricated GPA of 16.80
> "Excellent" for students holding no grades at all, and mock prayer times
> rendered as live. On the standing instruction that *everything must be
> actually functional, not mocked up*, a **Phase 0** has been added ahead of all
> feature work, and the phase 1 decision to *regenerate* demo mood seeds has been
> reversed to *remove* them.

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

Phases 0 and 1 are specified in this document. Each later phase gets its own
spec and implementation plan.

| # | Phase | Depends on |
|---|---|---|
| 0 | **Integrity** — stop fabricating data, stop persisting seeds, fix the bugs that lie to the user | — |
| 1 | **Data foundation** — shared hooks, journal attribution, real mood history | 0 |
| 2 | Case management — structured session notes (date/type/author) + per-student timeline | 1 |
| 3 | Check-in scales — structured wellbeing instrument with score history | 1 |
| 4 | Risk triage — composite score, ranked dashboard, explained reasons | 1, 3 |
| 5 | Interventions — assign exercises to a student, track completion | 1 |
| 6 | Analytics & reports — real charts, correlation, printable case summary | 1–4 |
| 7 | Scheduling & messaging — appointment slots, psychologist↔student/parent threads | 1 |

Phases 3–6 all answer "how is this student doing?" by combining mood, grades,
attendance and check-ins. That logic must exist in exactly one place or the risk
dashboard and the analytics report will disagree. `useStudentMetrics` is that
one place, and phase 1 creates it.

---

# Phase 0 — Integrity

## Problem

The app's entire longitudinal data layer is fabricated. Every chart, stat, alert
and badge that appears historical either reads a hardcoded array or a first-run
seed. Worse, the seeds are **written to `localStorage` and pushed to the shared
Neon `bloom_state` table**, then synced to every device — so invented data has
been promoted to real, is cross-device, and is now indistinguishable from
genuine records.

**The live database contains real data and must not be wiped.** Every cleanup
below is therefore fingerprint-based: it deletes only records that are provably
fake and preserves everything else.

## Verified findings

Confirmed by reading source. Line numbers current at `bc232a4`.

### Root causes

| # | Location | Problem |
|---|---|---|
| R1 | `BloomContext.tsx:730-735` | `moodLogs` initialiser hardcodes 4 seeds instead of reading storage, so every load paints fake moods before `:881` replaces them. |
| R2 | `BloomContext.tsx:886-937` | The `else { seedDemo*(); bloomSetJson(...) }` branches write demo data **to storage and onward to Neon**. One root cause for 8 findings. |
| R3 | `BloomContext.tsx:1498-1501` | `setCurrentMood` writes one scalar and appends no history. No user action anywhere can create a mood log. One root cause for 6 findings. |

### Urgent — these lie to a user or undermine a role

| # | Location | Problem |
|---|---|---|
| U1 | `HomeScreen.tsx:38`, `AcademicScreen.tsx:19` | A student with **zero grades** renders **GPA 16.80/20**; `HomeScreen.tsx:281` labels it "Excellent" unconditionally. |
| U2 | `HomeScreen.tsx:288` | `sparkData = [10, 12, 11, 14, 15, currentGPA]` — 5 of 6 points are literals. Real `gpaHistory` is never read. |
| U3 | `AcademicScreen.tsx:37-45` | Trimester chart uses literals and ignores `trimesterGrades`, which *is* real and writable. |
| U4 | `ParentScreen.tsx:197`, `:784` | The child-points chip renders the **logged-in parent's own** `userPoints`. |
| U5 | `ParentScreen.tsx:196` | A child with no level is reported to the parent as **level 12**. |
| U6 | `BloomContext.tsx:743-744` | Two invented clinical notes per demo student, seeded, persisted and **shown to parents as real psychologist advice** (`ParentScreen.tsx:169`). |
| U7 | `AttendanceTracker.tsx:46`, `:53` | Toggling one student calls `markAttendance` for the whole section, writing `"present"` for everyone unmarked. Opening the screen and tapping once manufactures attendance history. |
| U8 | `AttendanceTracker.tsx:129` | `summary.present + summary.unmarked` counts unmarked students as **Present**. |
| U9 | `BloomContext.tsx:172` | `samples[i]` against a 4-element array with no modulo. **Latent** `TypeError` at ≥5 students when behaviour notes are unpersisted (fresh device after an admin adds students). Line `:173` does it correctly. |
| U10 | `send-code/route.ts:75` | With no Gmail credentials the API returns `devCode` in the response, making email verification bypassable. |
| U11 | `api/sync/route.ts:25-29` | Every `GET /api/sync` re-injects missing demo emails into the shared store, so the demo roster is unremovable. |
| U12 | `BloomContext.tsx:802` | `daysAgo = log.date ? … : 0` — a missing date resolves to *today*, so the "last 7 days" window does no windowing. |
| U13 | `PsychologicalScreen.tsx:30` | `helpSent` is never reset, so a student can send exactly **one** help request per mount, silently suppressing the parent alert path. |
| U14 | `ParentScreen.tsx:829`, `:836` | Chart x-scale hardcodes `/3`, assuming 4 points; `recordGpaSnapshot` keeps 8, so points 5–8 plot off-canvas. |
| U15 | `TeacherDashboard.tsx:29`, `:41` | `vals.length > 0 ? … : 0` scores a student with no grades as `0.00` and tallies them as **failed**. |
| U16 | `TeacherDashboard.tsx:128` | Renders `new Date(m.timestamp)` → "Invalid Date" for every seed. |

### Dead features

| # | Location | Problem |
|---|---|---|
| D1 | `globals.css` (whole file) | **The 3-theme system does not work.** `BloomContext.tsx:960` writes `data-theme="CALM"\|"DARK"\|"MOTIVATING"` to `<html>`, but there is no `[data-theme]` rule anywhere and no `@custom-variant dark`. All 58 `dark:` utilities fall back to the OS preference. `setThemeMode` has zero call sites — there is no picker. |
| D2 | `BloomContext.tsx:377`, `:1214` | `getAttendanceForStudent` has zero call sites — the metric phase 1 depends on has no reader. |
| D3 | `BloomContext.tsx:369-371` | `updateTeacherSection`, `addStudentToSection`, `removeStudentFromSection` — zero call sites. Teachers cannot edit sections or move students. |
| D4 | `BloomContext.tsx:1355-1366` | `addMoodLog` — zero call sites, superseded by R3. |
| D5 | `BloomContext.tsx:460`, `:1488` | `setThemeMode` — zero call sites. |
| D6 | `AttendanceTracker.tsx:66` | `daysInMonth` assigned, never read, and wrong (a month index, not a day count). |
| D7 | `src/context/teacher.ts` | `useTeacherData` is a pure re-export of `BloomContext`; `TeacherDashboard` bypasses it. |
| D8 | `storage.ts:118` | Dead `// v0 -> v1` migration branch. |

## Design

### 0.1 — Seeding becomes development-only

All `else { seedDemo*() }` branches at `BloomContext.tsx:886-937` are gated
behind `process.env.NODE_ENV !== "production"`. In production an empty key
stays empty and the screen renders its existing honest empty state.

`ParentScreen` already renders `t("parent_no_data")` in eight places
(`:459`, `:567`, `:576`, `:717`, `:752`, `:859`, `:907`). That is the pattern
the rest of the app adopts. No new empty-state keys are needed for those.

`ensureDemoUsers()` in `api/sync/route.ts:25-29` is gated identically, ending
the re-injection of demo emails into the shared store.

`devCode` is removed from the `send-code` response (`:75`). With no provider
configured the route returns `ok: false` and a `503`, so registration fails
loudly instead of silently skipping verification. **Deployment requirement:**
`GMAIL_USER` and `GMAIL_APP_PASSWORD` must exist in Vercel or registration
breaks — which is the correct trade versus a bypassable verification step.

### 0.2 — Surgical demo-data cleanup

Because real data exists, cleanup is an **admin-triggered action with a dry-run
preview**, never an automatic wipe. The preview lists exactly what would be
deleted, by key and count, before anything is written.

Safety rests on a verified fact: real records are always generated as
`Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` — a base-36
timestamp plus 4 random characters, with no hyphens. Every seed uses a literal
prefixed id that a real id can never produce. Verified against `addBehaviorNote`,
`addScheduleEntry`, `sendParentMessage`, `addStudyPlanEntry`, `addPriorityTask`.

**Auto-purge — fingerprint is unambiguous:**

| Key | Fingerprint |
|---|---|
| `behaviorNotes` | `id` matches `/^bh-/` |
| `schedule` | `id` matches `/^sch-/` |
| `studyPlan` | `id` matches `/^sp-/` |
| `priorityTasks` | `id` matches `/^pt-/` |
| `attendance` | `sectionId === "1am_a"` while the student is **not** in that section per `teacherSections`. Real attendance cannot record a section the student does not belong to. |
| `moodLogs` | id in `{"1","2","3","4"}` **and** no `at` field — the phase 1 shape change makes every genuine log carry `at` |
| `guidanceNotes` | array entry exactly equal to a `psy_seed_note_*` locale string |
| `learningEntries`, `gratitudeEntries` | `text` exactly equal to a known seed string |
| `registeredUsers` | email present in the known `DEMO_ACCOUNTS` list |

**NOT auto-purged — genuinely ambiguous, surfaced for manual review:**

| Key | Why it is ambiguous |
|---|---|
| `gpaHistory` | Seeded as exactly 3 invented terms per student (`:928-936`), but `recordGpaSnapshot` appends real ones to the same array. No marker separates them. |
| `trimesterGrades` | Seeded 3 terms of invented per-subject grades (`:207-214`); admins write real grades through the same field. |
| `sections` | `DEFAULT_SECTIONS` seeds 30 invented students, but admins may have since edited or added to them. |
| `mood` (scalar) | A single current-mood value; harmless once history is real, and phase 1 overwrites it. |

The tool never deletes a key it cannot prove. Ambiguous keys are listed with
their contents so an admin can decide per record.

### 0.3 — Charts read real data

| Location | Change |
|---|---|
| `HomeScreen.tsx:288` | `sparkData` → `gpaHistory[activeStudentName]`, with an empty state when fewer than 2 points exist. |
| `AcademicScreen.tsx:37-45` | `trimesters` → `trimesterGrades[currentStudent]` across all three terms. |
| `ParentScreen.tsx:829`, `:836` | Replace `/3` with `/ Math.max(1, history.length - 1)`. |
| `ParentScreen.tsx:196` | Drop the `\|\| 12` level fallback; render the real level or nothing. |

### 0.4 — Fabricated values become honest states

- `HomeScreen.tsx:38`, `AcademicScreen.tsx:19` — remove the `16.8` GPA
  fallback; render an empty state when a student has no grades.
- `HomeScreen.tsx:281` — "Excellent" becomes conditional on the GPA band.
- `HomeScreen.tsx:76-83` — the five hardcoded prayer times are labelled
  `"Mock prayer times"` in a comment while rendering as live. Either compute
  them or move them behind an explicit demo flag. Simplest honest option:
  remove the card, since a static Algiers table cannot be correct for every user.
- `HomeScreen.tsx:378`, `AcademicScreen.tsx:165` — "close to your weekly goal"
  and "Excellent level!" render unconditionally; make both derive from data.
- `TeacherDashboard.tsx:29`, `:41` — a student with no grades yields `null`, and
  is excluded from both the class average and the failed count.

### 0.5 — Bug fixes

- `BloomContext.tsx:172` — `samples[i % samples.length]`, matching `:173`.
- `AttendanceTracker.tsx:46` — return `null` for unmarked rather than
  defaulting to `"present"`; `:53` writes only the tapped student; `:129` drops
  `+ summary.unmarked`.
- `PsychologicalScreen.tsx:30` — reset `helpSent` so more than one help request
  is possible per mount.
- `BloomContext.tsx:802` — derive the fatigue window from the real timestamp
  (folded into phase 1's `MoodLog` change).
- Dead code D1–D8 is removed. D1 (`setThemeMode`, `data-theme`,
  `BLOOM_KEYS.themeMode`) is deleted outright per 0.6.

### 0.6 — The theme system is removed

D1 is resolved by **deletion**, per an explicit product decision: the app does
not use the 3-theme system.

- Delete `setThemeMode` from the context (interface `:460`, implementation
  `:1488-1491`, exposure `:1689`).
- Delete `BLOOM_KEYS.themeMode` and the `themeMode` state, and stop writing
  `data-theme` to `<html>` (`:960`).
- Leave `globals.css` and the 58 `dark:` utilities alone. They already fall back
  to Tailwind v4's `prefers-color-scheme`, which follows the OS and is correct
  behaviour for a two-mode light/dark app.
- Add a one-time `STORAGE_VERSION` bump to 3 to clear the orphaned
  `bloom_theme_mode` key. This is the first bump that genuinely needs one,
  because a removed key leaves real residue behind.

**A note on what this means visually:** today the `dark:` utilities respond to
the OS, so nothing changes for the user in practice. What disappears is the
false promise of a CALM / MOTIVATING choice that never worked. The previously
persisted theme value is discarded, so anyone who had `CALM` selected reverts to
the OS preference.

## Testing

Beyond the phase 1 harness cases:

1. **Purge safety — the critical test.** Build a fixture containing both real
   records and every seed fingerprint. Run the purge. Assert every real record
   survives and every fingerprinted record is removed. Then run it against the
   ambiguous keys and assert it **removes nothing**.
2. **Id-collision proof.** Assert no generated id can match `/^(bh|sch|sp|pt)-/`.
3. **Attendance integrity.** Toggling one student in a 6-student section writes
   exactly one record, and unmarked students stay unmarked.
4. **GPA fallback.** A student with `{}` grades renders the empty state, never
   `16.8`.
5. **Seeding gate.** With `NODE_ENV=production`, no seed branch writes.
6. **`devCode` absent** from the send-code response in every configuration.

Regression guard: `npm run build` passes and `npm run lint` does not exceed the
pre-existing baseline of **47 errors / 125 warnings**.

---

# Phase 1 — Data Foundation


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

### 3. Seeds are removed, not regenerated

> **Reversed from the original draft.** This section previously proposed
> replacing the 4 hardcoded seeds with generated entries spread over 7 days so
> the Mood Trends card would have something to render. That contradicts the
> standing requirement that nothing be mocked, and it would have made fabricated
> data look deliberate. Removed.

The 4 hardcoded seeds at `:731-734` are deleted outright. With phase 0's
seeding gate, nothing recreates them, and the live database's copies are removed
by the phase 0 purge (fingerprint: id in `{"1","2","3","4"}` with no `at`).

The Mood Trends card renders an honest empty state until real moods exist. An
empty trend is truthful; an invented one is not, and a psychologist making a
clinical judgement is exactly the user for whom a fabricated trend is
dangerous.

The `useState` initializer moves to reading storage with a normalizer, so there
is no flash of fake data:

```ts
const [moodLogs, setMoodLogsState] = useState<MoodLog[]>(() =>
  normalizeMoodLogs(bloomGetJson<MoodLog[] | null>(BLOOM_KEYS.moodLogs, null))
);
```

`page.tsx:711-713` gates rendering on `bloomHydrateFromServer()` resolving, so
local storage is already hydrated when this initializer runs. Reading in the
initializer rather than the mount effect at `:845`/`:881` removes the flash.

`normalizeMoodLogs` is pure and idempotent: it drops any entry without a
parseable `at` and returns `[]` otherwise — it never invents data. It is safe to
run on every load and needs no storage-version bump.

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
   and returns `[]` — never a fabricated entry — for empty input.
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
seeds — except in the live database, where phase 0's fingerprinted purge removes
exactly those. There is no real mood data to lose, which is what makes the clean
break in `MoodLog` safe.

**No fabricated data is ever substituted for missing data.** This is now a
project-wide rule, not a phase 1 note. Where a value is unknown the app renders
an empty state. The original phase 1 draft proposed seeding a realistic 7-day
mood history so the trends card would look populated; that was withdrawn. A
psychologist making a clinical judgement from an invented trend is precisely the
failure mode this programme exists to remove.

**Ambiguous legacy keys are never auto-deleted.** `gpaHistory`,
`trimesterGrades` and `sections` contain both seeded and genuine records with no
marker to separate them. Phase 0 surfaces them for a human decision instead of
guessing, because destroying a real student's history is worse than leaving some
fake data visible behind an admin review.

**The 5-minute window and 500-entry cap are judgment calls**, chosen to be
invisible to a real user while preventing accidental flooding. Neither is
derived from anything in the code; both are single constants and trivial to
change.

**Extending `useStudentMetrics` rather than growing `BloomContext`.**
`BloomContext.tsx` is already 1,715 lines. Six further feature areas of derived
analysis inside it would make it unmaintainable, and a pure module in `src/lib`
plus two hooks in `src/hooks` can be unit-tested without mounting a provider.
