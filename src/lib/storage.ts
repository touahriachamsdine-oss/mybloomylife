// Typed, namespaced, versioned localStorage wrapper for MyBloom Life.
//
// Every persistent value flows through this module so that:
//   - keys are declared in one place (BLOOM_KEYS)
//   - reads/writes are guarded against quota/privacy-mode failures
//   - a version marker enables one-time data migrations
//   - legacy values stored before this module existed remain readable

const NAMESPACE = "bloom_";

export const BLOOM_KEYS = {
  themeMode: "bloom_theme_mode",
  language: "bloom_language",
  mood: "bloom_mood",
  points: "bloom_points",
  goals: "bloom_goals",
  supportMessages: "bloom_support_messages",
  userRole: "bloom_user_role",
  currentUser: "bloom_current_user",
  studentGrades: "bloom_student_grades",
  gpaHistory: "bloom_gpa_history",
  moodLogs: "bloom_mood_logs",
  studentLevels: "bloom_student_levels",
  linkedChildren: "bloom_linked_children",
  levelsConfig: "bloom_levels_config",
  customGames: "bloom_custom_games",
  registeredUsers: "bloom_registered_users",
  familyLinkCodes: "bloom_family_link_codes",
  guidanceNotes: "bloom_guidance_notes",
  learningEntries: "bloom_learning_entries",
  gratitudeEntries: "bloom_gratitude_entries",
  kidTime: "bloom_kid_time",
  parentPins: "bloom_parent_pins",
  sections: "bloom_sections",
  attendance: "bloom_attendance",
  behaviorNotes: "bloom_behavior_notes",
  schedule: "bloom_schedule",
  parentMessages: "bloom_parent_messages",
  studyPlan: "bloom_study_plan",
  priorityTasks: "bloom_priority_tasks",
  helpRequests: "bloom_help_requests",
  dailyChallenges: "bloom_daily_challenges",
  studentAssignments: "bloom_student_assignments",
  storageVersion: "bloom_storage_version",
} as const;

const STORAGE_VERSION = 2;

export function storageAvailable(): boolean {
  try {
    const probe = "__bloom_storage_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function bloomGetRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function bloomSetRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors (quota / privacy mode)
  }
  enqueueSync(key, value);
}

export function bloomRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  enqueueSync(key, ""); // empty value = tombstone
}

export function bloomGetJson<T>(key: string, fallback: T): T {
  const raw = bloomGetRaw(key);
  if (raw === null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function bloomSetJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors (quota / privacy mode)
  }
}

// Runs once per STORAGE_VERSION bump. Legacy bloom_* keys keep their names
// so previously stored data survives; migrations fix shape when needed.
export function runStorageMigrations(): void {
  const stored = bloomGetRaw(BLOOM_KEYS.storageVersion);
  const version = stored ? parseInt(stored, 10) : 0;
  if (!Number.isFinite(version) || version >= STORAGE_VERSION) return;

  // v0 -> v1: no reshaping required yet.

  // v1 -> v2: clear stale sessions. The old sync layer let the remote store
  // overwrite the per-device session (bloom_user_role / bloom_current_user),
  // so devices could boot into another user's session. Sign everyone out once
  // so each user logs in again on their own account.
  if (version < 2) {
    bloomRemove(BLOOM_KEYS.userRole);
    bloomRemove(BLOOM_KEYS.currentUser);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(BLOOM_KEYS.userRole);
        localStorage.removeItem(BLOOM_KEYS.currentUser);
      } catch {
        // ignore
      }
    }
  }

  bloomSetRaw(BLOOM_KEYS.storageVersion, String(STORAGE_VERSION));
}

// Backup: snapshot every namespaced value (used by the data export feature).
export function bloomExportAll(): Record<string, string> {
  try {
    const data: Record<string, string> = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(NAMESPACE)) data[key] = localStorage.getItem(key) || "";
    });
    return data;
  } catch {
    return {};
  }
}

// Restore a previously exported snapshot (used by the data import feature).
export function bloomImportAll(data: Record<string, string>): void {
  try {
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(NAMESPACE)) localStorage.setItem(key, value);
    });
  } catch {
    // ignore storage errors
  }
}

/* ==========================================================================
   Neon sync layer
   Every write above mirrors into the remote Neon store (debounced), and the
   app boot-straps from the remote store on load so multiple devices converge.
   ========================================================================== */

const SYNC_ENDPOINT = "/api/sync";
const FLUSH_DEBOUNCE_MS = 900;

// Keys that have changed locally but not yet been pushed to the server.
let pendingSync = new Map<string, string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function enqueueSync(key: string, value: string): void {
  if (typeof window === "undefined") return;
  pendingSync.set(key, value);
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushPending();
    }, FLUSH_DEBOUNCE_MS);
  }
}

async function flushPending(): Promise<void> {
  if (pendingSync.size === 0) return;
  const rows = Array.from(pendingSync.entries()).map(([key, value]) => ({ key, value }));
  pendingSync.clear();
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error(`sync status ${res.status}`);
  } catch (e) {
    // Transient failure: re-queue so the change is not lost.
    console.warn("[sync] push failed, will retry", e);
    rows.forEach((r) => pendingSync.set(r.key, r.value));
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        void flushPending();
      }, 5000);
    }
  }
}

// Force any queued writes to the server immediately (used on logout/export).
export function bloomSyncNow(): Promise<void> {
  return flushPending();
}

async function postRows(rows: { key: string; value: string }[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await fetch(SYNC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error(`sync status ${res.status}`);
}

// Boot-strap: pull the authoritative remote state into localStorage and push
// any local-only keys up so first-run data migrates to the cloud.
export async function bloomHydrateFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  let remote: Record<string, string> = {};
  try {
    const res = await fetch(SYNC_ENDPOINT);
    if (res.ok) {
      const json = await res.json();
      remote = json.state || {};
    }
  } catch {
    // No connectivity: keep local data; app still works offline.
  }

  // Upload local-only keys (e.g. first-run seeds on a brand-new device).
  const local = bloomExportAll();
  const localOnly = Object.entries(local).filter(([key]) => !(key in remote));
  if (localOnly.length > 0) {
    try {
      await postRows(localOnly.map(([key, value]) => ({ key, value })));
    } catch {
      // ignore; will be picked up by debounced writes
    }
  }

  // Server wins for keys it already knows about — EXCEPT the session itself
  // (who is logged-in on this device). The session is per-device state, and a
  // shared remote store must not overwrite it across devices/accounts.
  const SESSION_KEYS = new Set<string>([BLOOM_KEYS.userRole, BLOOM_KEYS.currentUser]);
  for (const [key, value] of Object.entries(remote)) {
    if (SESSION_KEYS.has(key)) continue;
    if (value === "") {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
  }
}
