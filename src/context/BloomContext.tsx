"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import localesData from "../app/locales.json";
import { BLOOM_KEYS, bloomGetJson, bloomSetJson, bloomGetRaw, bloomSetRaw, bloomRemove, bloomSyncNow, runStorageMigrations } from "@/lib/storage";
import { verifyPassword, createCredential, seedDemoAccounts, isDemoAccountEmail } from "@/lib/auth";
import {
  appendMoodLog,
  negativeMoodCountInWindow,
  normalizeJournalEntries,
  normalizeMoodLogs,
  shouldLogMood,
} from "@/lib/mood";

export type AppLanguage = "ar" | "en" | "fr" | "kab";

// Kids Mode: daily play-time limit for children using the parent's account.
// 30 minutes on weekdays (Sun-Thu), 1 hour on weekends (Fri-Sat).
const KID_WEEKDAY_LIMIT_MS = 30 * 60 * 1000;
const KID_WEEKEND_LIMIT_MS = 60 * 60 * 1000;

export function getKidDailyLimitMs(now: Date = new Date()): number {
  const day = now.getDay(); // 0=Sun ... 5=Fri, 6=Sat
  const isWeekend = day === 5 || day === 6;
  return isWeekend ? KID_WEEKEND_LIMIT_MS : KID_WEEKDAY_LIMIT_MS;
}

// The parent role's play-time budget is tracked under a single account-level bucket.
const PARENT_PLAYTIME_KEY = "parent";

// Moods that count toward a "fatigue / stress" alert for parents are defined
// once in @/lib/mood as isNegativeMood(). A second local copy of this list is
// how the two definitions drift apart.

// Screens that belong to the student experience and are time-limited for parents.
const STUDENT_SCREENS = ["home", "academic", "games", "psychological", "learning", "gratitude", "goals", "planner", "portfolio"];

// ---- Algerian School Level System ----
export type AlgerianCycle = "primaire" | "moyen" | "lycee";
export interface AlgerianLevel {
  cycle: AlgerianCycle;
  year: number;          // 1-5 for primaire, 1-4 for moyen, 1-3 for lycee
  track?: string;        // only for lycee year 2-3: "sciences" | "maths" | "lettres" | "gestion"
  label: string;         // human-readable display label
}

// Canonical subject keys per cycle
export const SUBJECTS_BY_CYCLE: Record<AlgerianCycle, string[]> = {
  primaire: ["subject_arabic", "subject_tamazight", "subject_french", "subject_math", "subject_science", "subject_islamic", "subject_civic"],
  moyen:    ["subject_arabic", "subject_tamazight", "subject_french", "subject_math", "subject_physics", "subject_science", "subject_english", "subject_islamic", "subject_history_geo", "subject_civic"],
  lycee:    ["subject_arabic", "subject_french", "subject_english", "subject_math", "subject_physics", "subject_science", "subject_islamic", "subject_history_geo", "subject_philosophy"]
};

export interface Goal {
  id: string;
  title: string; // translation key or custom string
  currentProgress: number;
  targetProgress: number;
  studentName?: string; // shared goals created by a parent for a specific child
  period?: GoalPeriod; // weekly (default) or monthly
}

export interface ParentAlert {
  id: string;
  type: "low_grade" | "goal_completed" | "fatigue" | "help_request";
  childName: string;
  timeValue: number;
  isDays: boolean;
}

export interface SupportMessage {
  id: string;
  toChild: string;
  message: string;
  timestamp: string;
}

export interface StudentGrades {
  [key: string]: number;
}

// Algerian school year is split into three trimesters (الثلاثيات).
export type TermId = "T1" | "T2" | "T3";
export const ALL_TERMS: TermId[] = ["T1", "T2", "T3"];
// Per-student, per-trimester grade books: student -> { T1: grades, T2: grades, T3: grades }
export type TrimesterGradesMap = Record<string, Partial<Record<TermId, StudentGrades>>>;

export interface MoodLog {
  id: string;
  student: string;
  mood: string;
  at: string; // ISO 8601. Canonical: sortable, bucketed and windowable.
}

// ---- Teacher data (sections, attendance, behavior, schedule, messages) ----
export interface ClassSection {
  id: string;
  name: string;
  cycle: AlgerianCycle;
  year: number;
  track?: string;
  studentNames: string[];
}

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  sectionId: string;
  studentName: string;
  status: AttendanceStatus;
}

export interface BehaviorNote {
  id: string;
  date: string;
  studentName: string;
  type: "positive" | "negative" | "general";
  note: string;
  teacherName: string;
}

export interface ScheduleEntry {
  id: string;
  day: number; // 0=Sunday .. 4=Thursday
  startTime: string; // "08:00"
  endTime: string;
  subject: string;
  sectionId: string;
  room?: string;
}

export interface ParentMessage {
  id: string;
  date: string;
  from: "teacher" | "parent";
  teacherName?: string;
  parentName?: string;
  studentName: string;
  content: string;
  read: boolean;
}

// Default sections used only on first run so teachers can explore the portal.
const DEFAULT_SECTIONS: ClassSection[] = [
  { id: "1am_a", name: "1AM A", cycle: "moyen", year: 1, studentNames: ["Sara", "Ahmed", "Lina", "Youssef", "Amira", "Mohamed"] },
  { id: "1am_b", name: "1AM B", cycle: "moyen", year: 1, studentNames: ["Imane", "Redha", "Nesrine", "Sami", "Dounia", "Rayan"] },
  { id: "2am_a", name: "2AM A", cycle: "moyen", year: 2, studentNames: ["Houda", "Anis", "Meriem", "Rafik", "Sofia", "Ryad"] },
  { id: "3am_a", name: "3AM A", cycle: "moyen", year: 3, studentNames: ["Kenza", "Lyes", "Yasmine", "Nadir", "Ines", "Walid"] },
  { id: "3am_b", name: "3AM B", cycle: "moyen", year: 3, studentNames: ["Rania", "Tahar", "Nour", "Ismail", "Dalia", "Zakaria"] },
];

// ---- Demo data seeders (for first run / empty DB so monitoring isn't blank) ----
//
// Development only. Every seeder below used to run on any device with an empty
// key and then persist its output, so a real deployment filled itself with
// invented attendance, behaviour notes, schedules, goals and GPA history on
// first load - and pushed them to the shared database for every other user.
// In production an empty key now stays empty and the UI shows an empty state.
const DEMO_SEEDING_ENABLED = process.env.NODE_ENV !== "production";
function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function seedDemoAttendance(students: string[]): AttendanceRecord[] {
  const statuses: AttendanceStatus[] = ["present", "present", "present", "late", "present", "excused", "present", "present"];
  const recs: AttendanceRecord[] = [];
  for (let d = 1; d <= 15; d++) {
    for (const s of students) {
      recs.push({ date: isoDaysAgo(d), sectionId: "1am_a", studentName: s, status: statuses[(d + s.length) % statuses.length] });
    }
  }
  return recs;
}
function seedDemoBehavior(students: string[]): BehaviorNote[] {
  const notes: BehaviorNote[] = [];
  const samples: [BehaviorNote["type"], string][] = [
    ["positive", "Helped a classmate understand the lesson."],
    ["general", "Participated well in today's activities."],
    ["positive", "Great effort on the maths exercise."],
    ["negative", "Was distracted during class, reminded to focus."],
  ];
  students.forEach((s, i) => {
    notes.push({ id: `bh-${s}-1`, date: isoDaysAgo(3 + i), studentName: s, type: samples[i][0], note: samples[i][1], teacherName: "Teacher" });
    notes.push({ id: `bh-${s}-2`, date: isoDaysAgo(9 + i), studentName: s, type: samples[(i + 1) % samples.length][0], note: samples[(i + 1) % samples.length][1], teacherName: "Teacher" });
  });
  return notes;
}
function seedDemoSchedule(): ScheduleEntry[] {
  const days = [0, 1, 2, 3, 4];
  const subjects = ["subject_math", "subject_arabic", "subject_french", "subject_science", "subject_english", "subject_physics", "subject_history_geo"];
  const times = ["08:00", "09:00", "10:00", "11:00"];
  const out: ScheduleEntry[] = [];
  let id = 1;
  days.forEach((day, di) => {
    for (let t = 0; t < 3; t++) {
      out.push({ id: `sch-${id++}`, day, startTime: times[t], endTime: times[t + 1], subject: subjects[(di + t) % subjects.length], sectionId: "1am_a" });
    }
  });
  return out;
}
function seedDemoStudyPlan(): StudyPlanEntry[] {
  const days = [0, 1, 2, 3];
  const out: StudyPlanEntry[] = [];
  let id = 1;
  days.forEach((day, i) => {
    out.push({ id: `sp-${id++}`, day, time: "17:00", subject: "subject_math", done: i % 2 === 0 });
    out.push({ id: `sp-${id++}`, day, time: "18:00", subject: "subject_french", done: false });
  });
  return out;
}
function seedDemoPriorityTasks(): PriorityTask[] {
  return [
    { id: "pt-1", title: "Finish maths homework", priority: "high", done: true },
    { id: "pt-2", title: "Revise French vocabulary", priority: "medium", done: false },
    { id: "pt-3", title: "Prepare science project", priority: "high", done: false },
  ];
}
function seedDemoTrimesters(students: string[]): TrimesterGradesMap {
  const map: TrimesterGradesMap = {};
  students.forEach((s) => {
    const base = s === "Sara" ? { subject_math: 16, subject_french: 14, subject_arabic: 16, subject_english: 15 } : { subject_math: 14, subject_french: 12, subject_arabic: 15, subject_english: 13 };
    map[s] = { T1: base, T2: Object.fromEntries(Object.entries(base).map(([k, v]) => [k, (v as number) + 0.5])), T3: Object.fromEntries(Object.entries(base).map(([k, v]) => [k, (v as number) + 1])), };
  });
  return map;
}

// ---- Student planner, priorities, help requests & daily challenges ----
export type GoalPeriod = "weekly" | "monthly";
export type TaskPriority = "high" | "medium" | "low";

export interface StudyPlanEntry {
  id: string;
  day: number; // 0=Sunday .. 4=Thursday
  time: string; // "17:00"
  subject: string;
  done: boolean;
}

export interface PriorityTask {
  id: string;
  title: string;
  priority: TaskPriority;
  done: boolean;
}

export interface HelpRequest {
  id: string;
  student: string;
  message: string;
  timestamp: string;
}

export interface DailyChallengeTask {
  id: string;
  labelKey: string;
  done: boolean;
}

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  tasks: DailyChallengeTask[];
  history: Record<string, boolean>; // date (YYYY-MM-DD) -> all tasks completed that day
}

const DEFAULT_DAILY_TASKS: DailyChallengeTask[] = [
  { id: "math", labelKey: "challenge_math", done: false },
  { id: "reading", labelKey: "challenge_reading", done: false },
  { id: "memory", labelKey: "challenge_memory", done: false },
  { id: "breathing", labelKey: "challenge_breathing", done: false },
  { id: "water", labelKey: "challenge_water", done: false },
];

// Journal entries carry the author and an ISO timestamp. Without `student`,
// entries from different children were indistinguishable and a parent viewing
// one child was shown every other child's journal. A locale date string
// ("26/09/2026") was used for the old `date` field, which cannot be sorted
// reliably; `at` is ISO 8601 and is rendered for display at the point of use.
export interface LearningEntry {
  id: string;
  student: string;
  subject: string;
  text: string;
  emoji: string;
  at: string;
}

export interface GratitudeEntry {
  id: string;
  student: string;
  text: string;
  emoji: string;
  at: string;
}

export interface AlgerianYear {
  year: number;
  label: string;
  tracks?: string[];
}

export interface AlgerianCycleConfig {
  cycle: AlgerianCycle;
  label: string;
  years: AlgerianYear[];
}

export interface CustomQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CustomGame {
  id: string;
  title: string;
  description: string;
  cycle: AlgerianCycle;
  type: "quiz" | "memory";
  questions?: CustomQuizQuestion[];
  emojis?: string[];
}

export interface RegisteredUser {
  email: string;
  name: string;
  role: "youth" | "parent" | "psychologist" | "admin";
  // Hashed credentials (PBKDF2-SHA256). A legacy `password` field is kept
  // only for accounts saved before hashing was introduced; it is migrated
  // to `salt`/`hash` on the next successful login.
  salt?: string;
  hash?: string;
  password?: string;
}

export interface StudentAssignment {
  parents: string[];
  psychologists: string[];
}

// Psychologist risk flag for one student. Surfaced on the psychologist's
// caseload roster and on the parent's monitoring view.
export type StudentRiskLevel = "low" | "medium" | "high";

export interface StudentRisk {
  level: StudentRiskLevel;
  note: string;
  updatedAt: string;
}

export interface BloomContextType {
  appLanguage: AppLanguage;
  currentMood: string; // key like "mood_calm"
  userPoints: number;
  goals: Goal[];
  activeScreen: string;
  drawerOpen: boolean;
  parentAuthenticated: boolean;
  parentAlerts: ParentAlert[];
  supportMessages: SupportMessage[];
  registeredUsers: RegisteredUser[];

  // Parental play-time limit (student screens accessible from the parent role)
  kidRemainingMs: number;
  getKidRemainingMs: () => number;
  
  // Auth state
  userRole: "youth" | "parent" | "psychologist" | "admin" | null;
  currentUser: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    name: string,
    password: string,
    role: "parent" | "psychologist" | "admin"
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Grade state
  studentGrades: Record<string, StudentGrades>;
  updateGrade: (student: string, subject: string, grade: number) => void;
  gpaHistory: Record<string, number[]>;
  recordGpaSnapshot: (student: string) => void;

  // Teacher portal
  teacherSections: ClassSection[];
  updateTeacherSection: (updated: ClassSection) => void;
  addStudentToSection: (sectionId: string, name: string) => void;
  removeStudentFromSection: (sectionId: string, name: string) => void;
  createStudentAccount: (name: string) => { success: boolean; code?: string };
  regenerateFamilyCode: (name: string) => string;
  attendance: AttendanceRecord[];
  markAttendance: (records: Omit<AttendanceRecord, "date">[], date: string) => void;
  getAttendanceForSection: (sectionId: string, date: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentName: string) => AttendanceRecord[];
  behaviorNotes: BehaviorNote[];
  addBehaviorNote: (note: Omit<BehaviorNote, "id" | "date">) => void;
  deleteBehaviorNote: (id: string) => void;
  getBehaviorForStudent: (studentName: string) => BehaviorNote[];
  schedule: ScheduleEntry[];
  addScheduleEntry: (entry: Omit<ScheduleEntry, "id">) => void;
  removeScheduleEntry: (id: string) => void;
  getScheduleForDay: (day: number) => ScheduleEntry[];
  parentMessages: ParentMessage[];
  sendParentMessage: (msg: Omit<ParentMessage, "id" | "date">) => void;
  markMessageRead: (id: string) => void;
  getMessagesForStudent: (studentName: string) => ParentMessage[];
  getUnreadParentMessages: () => ParentMessage[];

  // Student planner & priorities
  studyPlan: StudyPlanEntry[];
  addStudyPlanEntry: (entry: Omit<StudyPlanEntry, "id" | "done">) => void;
  removeStudyPlanEntry: (id: string) => void;
  toggleStudyPlanDone: (id: string) => void;
  priorityTasks: PriorityTask[];
  addPriorityTask: (task: Omit<PriorityTask, "id">) => void;
  removePriorityTask: (id: string) => void;
  togglePriorityTask: (id: string) => void;

  // Student help requests (surfaced to parents)
  helpRequests: HelpRequest[];
  requestHelp: (message: string) => void;

  // Daily learning challenges
  dailyChallenges: DailyChallengeState;
  toggleDailyChallenge: (taskId: string) => void;
  challengeStreak: number;
  challengeBestStreak: number;

  // Algerian level system
  studentLevels: Record<string, AlgerianLevel | null>;
  updateStudentLevel: (student: string, level: AlgerianLevel) => void;

  // Family linking
  familyLinkCodes: Record<string, string>;
  linkedChildren: string[];
  linkChildAccount: (code: string) => { success: boolean; childName?: string };

  // Admin-assigned access: which parents & psychologists may see each student.
  // Only those users (plus the student and the admin) can view the student's data.
  studentAssignments: Record<string, StudentAssignment>;
  assignStudentRoles: (studentName: string, assignments: StudentAssignment) => void;
  studentRisks: Record<string, StudentRisk>;
  setStudentRisk: (studentName: string, level: StudentRiskLevel, note: string) => void;

  // Trimester (semester) grading system
  activeTerm: TermId;
  setActiveTerm: (term: TermId) => void;
  trimesterGrades: TrimesterGradesMap;
  updateTermGrade: (student: string, term: TermId, subject: string, value: number) => void;
  getTermGrades: (student: string, term: TermId) => StudentGrades;

  // Mood history logs
  moodLogs: MoodLog[];

  // Counselor guidance notes (per student)
  guidanceNotes: Record<string, string[]>;
  updateGuidanceNotes: (student: string, notes: string[]) => void;

  // Learning journal & gratitude journal entries
  learningEntries: LearningEntry[];
  updateLearningEntries: (entries: LearningEntry[]) => void;
  gratitudeEntries: GratitudeEntry[];
  updateGratitudeEntries: (entries: GratitudeEntry[]) => void;

  // Account management
  deleteRegisteredUser: (email: string) => void;

  // Dynamic levels/tracks & Custom Games
  algerianLevels: AlgerianCycleConfig[];
  addCustomTrack: (cycle: AlgerianCycle, year: number, trackName: string) => void;
  addCustomYear: (cycle: AlgerianCycle, label: string) => void;
  customGames: CustomGame[];
  addCustomGame: (game: Omit<CustomGame, "id">) => void;

  // Setters/Action functions
  setAppLanguage: (lang: AppLanguage) => void;
  setCurrentMood: (mood: string) => void;
  addPoints: (points: number) => void;
  addGoal: (title: string, target: number, studentName?: string, period?: GoalPeriod) => void;
  incrementGoalProgress: (id: string) => void;
  deleteGoal: (id: string) => void;
  setActiveScreen: (screen: string) => void;
  setDrawerOpen: (open: boolean) => void;
  setParentAuthenticated: (auth: boolean) => void;
  sendSupportMessage: (to: string, msg: string) => void;
  t: (key: string, ...args: (string | number)[]) => string;
  isRtl: boolean;
}

const BloomContext = createContext<BloomContextType | undefined>(undefined);

// Local date key "YYYY-MM-DD" for daily budget resets
function kidToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Cumulative used time (ms) for a child today
function getKidUsedMs(child: string): number {
  const map = bloomGetJson<Record<string, { date: string; usedMs: number }>>(BLOOM_KEYS.kidTime, {});
  const entry = map[child];
  if (!entry || entry.date !== kidToday()) return 0;
  return typeof entry.usedMs === "number" ? entry.usedMs : 0;
}

function saveKidUsedMs(child: string, usedMs: number) {
  const map = bloomGetJson<Record<string, { date: string; usedMs: number }>>(BLOOM_KEYS.kidTime, {});
  map[child] = { date: kidToday(), usedMs: Math.max(0, usedMs) };
  bloomSetJson(BLOOM_KEYS.kidTime, map);
}

export const BloomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global States
  const [appLanguage, setAppLanguageState] = useState<AppLanguage>("ar");
  const [currentMood, setCurrentMoodState] = useState<string>("mood_calm");
  const [userPoints, setUserPointsState] = useState<number>(2350);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [activeScreen, setActiveScreenState] = useState<string>("home");
  const [drawerOpen, setDrawerOpenState] = useState<boolean>(false);
  const [parentAuthenticated, setParentAuthenticatedState] = useState<boolean>(false);
  const [supportMessages, setSupportMessagesState] = useState<SupportMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  // Parental play-time limit: counts down while a parent browses any student screen.
  // The budget resets daily and is 30 min on weekdays / 1 hour on weekends.
  const [kidRemainingMs, setKidRemainingMs] = useState<number>(() =>
    Math.max(0, getKidDailyLimitMs() - getKidUsedMs(PARENT_PLAYTIME_KEY))
  );
  const kidRemainingRef = useRef<number>(Math.max(0, getKidDailyLimitMs() - getKidUsedMs(PARENT_PLAYTIME_KEY)));

  const getKidRemainingMs = (): number =>
    Math.max(0, getKidDailyLimitMs() - getKidUsedMs(PARENT_PLAYTIME_KEY));

  // Registered users list (populated from storage; demo accounts seeded on first run)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  // Auth state
  const [userRole, setUserRoleState] = useState<"youth" | "parent" | "psychologist" | "admin" | null>(null);
  const [currentUser, setCurrentUserState] = useState<{ email: string; name: string } | null>(null);

  // Tick the play-time countdown once per second while a parent is on a student screen
  const kidTicksRef = useRef<number>(0);
  useEffect(() => {
    if (userRole !== "parent") return;
    if (!STUDENT_SCREENS.includes(activeScreen)) return;
    if (kidRemainingRef.current <= 0) return;
    kidTicksRef.current = 0;
    const id = setInterval(() => {
      kidTicksRef.current += 1;
      const next = Math.max(0, kidRemainingRef.current - 1000);
      kidRemainingRef.current = next;
      setKidRemainingMs(next);
      if (next <= 0) {
        saveKidUsedMs(PARENT_PLAYTIME_KEY, getKidDailyLimitMs());
        clearInterval(id);
      } else if (kidTicksRef.current % 5 === 0) {
        // Checkpoint every 5s. A modulo on the absolute remaining value could
        // never fire once the starting value was not a multiple of 5000, which
        // silently dropped the accumulated usage.
        saveKidUsedMs(PARENT_PLAYTIME_KEY, getKidDailyLimitMs() - next);
      }
    }, 1000);
    return () => {
      clearInterval(id);
      saveKidUsedMs(PARENT_PLAYTIME_KEY, getKidDailyLimitMs() - kidRemainingRef.current);
    };
  }, [userRole, activeScreen]);

  // Grades state (Algerian subjects & 20-point scale grades)
  const [studentGrades, setStudentGradesState] = useState<Record<string, StudentGrades>>({
    Sara: {
      subject_math: 16.5,
      subject_physics: 15.0,
      subject_science: 14.5,
      subject_arabic: 16.0,
      subject_french: 14.0,
      subject_english: 15.5,
      subject_islamic: 17.0,
      subject_history_geo: 14.0,
      subject_philosophy: 13.5
    },
    Ahmed: {
      subject_math: 14.0,
      subject_physics: 13.0,
      subject_science: 15.0,
      subject_arabic: 15.5,
      subject_tamazight: 16.0,
      subject_french: 12.5,
      subject_english: 13.0,
      subject_islamic: 16.5,
      subject_history_geo: 14.0,
      subject_civic: 15.0
    }
  });

  // Real per-student GPA trend snapshots (recorded when a new GPA is reached)
  const [gpaHistory, setGpaHistoryState] = useState<Record<string, number[]>>({});

  // Teacher portal data (centralized; was a separate useTeacherData store)
  const [teacherSections, setTeacherSections] = useState<ClassSection[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [behaviorNotes, setBehaviorNotes] = useState<BehaviorNote[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>([]);

  // Student planner, priorities, help requests & daily challenges
  const [studyPlan, setStudyPlanState] = useState<StudyPlanEntry[]>([]);
  const [priorityTasks, setPriorityTasksState] = useState<PriorityTask[]>([]);
  const [helpRequests, setHelpRequestsState] = useState<HelpRequest[]>([]);
  const [dailyChallenges, setDailyChallengesState] = useState<DailyChallengeState>(() => {
    const saved = bloomGetJson<DailyChallengeState | null>(BLOOM_KEYS.dailyChallenges, null);
    const today = new Date().toISOString().slice(0, 10);
    if (saved && saved.date === today) return { ...saved, history: saved.history ?? {} };
    // New day: keep the completion history so streaks survive the rollover.
    return { date: today, tasks: DEFAULT_DAILY_TASKS.map(t => ({ ...t })), history: saved?.history ?? {} };
  });

  // Streak helpers: consecutive fully-completed challenge days. A day counts
  // once every challenge task is done. The current streak is counted from today
  // if today is complete, otherwise from yesterday (a streak isn't broken until
  // a full day is missed).
  const { challengeStreak, challengeBestStreak } = useMemo(() => {
    const history = dailyChallenges.history ?? {};
    const dateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const todayKey = dateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = dateKey(yesterday);

    let current = 0;
    if (history[todayKey]) {
      current = 1;
      const cursor = new Date();
      while (true) {
        cursor.setDate(cursor.getDate() - 1);
        if (history[dateKey(cursor)]) current++;
        else break;
      }
    } else if (history[yesterdayKey]) {
      current = 1;
      const cursor = new Date(yesterday);
      while (true) {
        cursor.setDate(cursor.getDate() - 1);
        if (history[dateKey(cursor)]) current++;
        else break;
      }
    }

    let best = 0;
    const doneDates = Object.keys(history)
      .filter(k => history[k])
      .sort();
    if (doneDates.length > 0) {
      let run = 1;
      best = 1;
      for (let i = 1; i < doneDates.length; i++) {
        const prev = new Date(doneDates[i - 1] + "T00:00:00");
        const cur = new Date(doneDates[i] + "T00:00:00");
        const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
        if (diffDays === 1) {
          run++;
          if (run > best) best = run;
        } else {
          run = 1;
        }
      }
    }
    return { challengeStreak: current, challengeBestStreak: best };
  }, [dailyChallenges.history]);

  // Algerian level state (persisted)
  const [studentLevels, setStudentLevelsState] = useState<Record<string, AlgerianLevel | null>>({
    Sara: null,
    Ahmed: null
  });

  // Default Algerian levels configuration
  const defaultLevels: AlgerianCycleConfig[] = [
    {
      cycle: "primaire",
      label: "الابتدائي — Primaire",
      years: [
        { year: 1, label: "1ère AP" },
        { year: 2, label: "2ème AP" },
        { year: 3, label: "3ème AP" },
        { year: 4, label: "4ème AP" },
        { year: 5, label: "5ème AP" }
      ]
    },
    {
      cycle: "moyen",
      label: "المتوسط — Moyen (CEM)",
      years: [
        { year: 1, label: "1ère AM" },
        { year: 2, label: "2ème AM" },
        { year: 3, label: "3ème AM" },
        { year: 4, label: "4ème AM — BEM" }
      ]
    },
    {
      cycle: "lycee",
      label: "الثانوي — Lycée",
      years: [
        { year: 1, label: "1ère AS — Tronc commun" },
        { year: 2, label: "2ème AS", tracks: ["Sciences Naturelles", "Sciences Physiques", "Mathématiques", "Lettres & Philosophie", "Gestion & Économie"] },
        { year: 3, label: "3ème AS — BAC", tracks: ["Sciences Naturelles", "Sciences Physiques", "Mathématiques", "Lettres & Philosophie", "Gestion & Économie"] }
      ]
    }
  ];

  const [algerianLevels, setAlgerianLevels] = useState<AlgerianCycleConfig[]>(defaultLevels);
  const [customGames, setCustomGames] = useState<CustomGame[]>([]);

  const [familyLinkCodes, setFamilyLinkCodes] = useState<Record<string, string>>({
    Sara: "BLM-7X4",
    Ahmed: "BLM-9K2"
  });

  // Parent's linked children list (persisted)
  const [linkedChildren, setLinkedChildrenState] = useState<string[]>([]);

  // Admin-assigned roles per student (persisted). Keys are student names.
  const [studentAssignments, setStudentAssignmentsState] = useState<Record<string, StudentAssignment>>(() =>
    bloomGetJson<Record<string, StudentAssignment>>(BLOOM_KEYS.studentAssignments, {})
  );

  // Psychologist risk flags per student (persisted). Keys are student names.
  const [studentRisks, setStudentRisksState] = useState<Record<string, StudentRisk>>(() =>
    bloomGetJson<Record<string, StudentRisk>>(BLOOM_KEYS.studentRisks, {})
  );

  // Trimester grading: current term + per-term grade books.
  const [activeTerm, setActiveTermState] = useState<TermId>(() => (bloomGetRaw(BLOOM_KEYS.activeTerm) as TermId) || "T1");
  const [trimesterGrades, setTrimesterGradesState] = useState<TrimesterGradesMap>(() =>
    bloomGetJson<TrimesterGradesMap>(BLOOM_KEYS.trimesterGrades, {})
  );

  // Mood history (persisted). Read in the initializer rather than the mount
  // effect so no fake data is painted before storage is applied. Legacy entries
  // carried an unparseable locale timestamp instead of `at`; normalizeMoodLogs
  // drops them rather than inventing a time for them.
  const [moodLogs, setMoodLogsState] = useState<MoodLog[]>(() =>
    normalizeMoodLogs(bloomGetJson<MoodLog[] | null>(BLOOM_KEYS.moodLogs, null))
  );

  // Counselor guidance notes (persisted, keyed by student name). Starts empty:
  // seeding invented clinical notes here attributed fake observations to the
  // psychologist and showed them to parents as real advice.
  const [guidanceNotes, setGuidanceNotesState] = useState<Record<string, string[]>>(() =>
    bloomGetJson<Record<string, string[]> | null>(BLOOM_KEYS.guidanceNotes, null) ?? {}
  );

  // Learning & gratitude journal entries (persisted). Legacy entries had
  // neither an author nor a sortable timestamp, so they cannot be attributed to
  // a child or ordered; they are dropped rather than guessed at.
  const [learningEntries, setLearningEntriesState] = useState<LearningEntry[]>(() =>
    normalizeJournalEntries<LearningEntry>(
      bloomGetJson<LearningEntry[] | null>(BLOOM_KEYS.learningEntries, null)
    )
  );
  const [gratitudeEntries, setGratitudeEntriesState] = useState<GratitudeEntry[]>(() =>
    normalizeJournalEntries<GratitudeEntry>(
      bloomGetJson<GratitudeEntry[] | null>(BLOOM_KEYS.gratitudeEntries, null)
    )
  );

  // Default seeded goals & alerts
  // Parent alerts are derived from real data (grades, shared goals, mood logs)
  const parentAlerts: ParentAlert[] = useMemo(() => {
    const alerts: ParentAlert[] = [];

    // 1) Low grades (< 10) per student
    Object.entries(studentGrades).forEach(([student, grades]) => {
      const lowCount = Object.values(grades).filter(g => g < 10).length;
      if (lowCount > 0) {
        alerts.push({
          id: `grade-${student}`,
          type: "low_grade",
          childName: `parent_child_${student.toLowerCase()}`,
          timeValue: lowCount,
          isDays: false,
        });
      }
    });

    // 2) Completed shared goals
    goals.forEach((goal) => {
      if (goal.studentName && goal.currentProgress >= goal.targetProgress) {
        alerts.push({
          id: `goal-${goal.id}`,
          type: "goal_completed",
          childName: `parent_child_${goal.studentName.toLowerCase()}`,
          timeValue: goal.currentProgress,
          isDays: false,
        });
      }
    });

    // 3) Fatigue signal: 3+ negative moods in the last 7 days
    // This used to read log.date, falling back to 0 days ago when absent, so a
    // log of unknown age counted as current and the window did no windowing at
    // all. negativeMoodCountInWindow ignores undated entries instead.
    const now = Date.now();
    const studentsWithNegativeMoods = Array.from(new Set(moodLogs.map((l) => l.student)));
    const negativeByStudent: Record<string, number> = {};
    studentsWithNegativeMoods.forEach((student) => {
      const count = negativeMoodCountInWindow(moodLogs, student, 7, now);
      if (count > 0) negativeByStudent[student] = count;
    });
    Object.entries(negativeByStudent).forEach(([student, count]) => {
      if (count >= 3) {
        alerts.push({
          id: `fatigue-${student}`,
          type: "fatigue",
          childName: `parent_child_${student.toLowerCase()}`,
          timeValue: count,
          isDays: false,
        });
      }
    });

    // 4) Student asked for help
    helpRequests.forEach((r) => {
      alerts.push({
        id: `help-${r.id}`,
        type: "help_request",
        childName: `parent_child_${r.student.toLowerCase()}`,
        timeValue: 1,
        isDays: false,
      });
    });

    return alerts;
  }, [studentGrades, goals, moodLogs, helpRequests]);

  // Handle SSR mounting
  useEffect(() => {
    setMounted(true);
    runStorageMigrations();
    // Load from localStorage if present
    const savedLang = bloomGetRaw(BLOOM_KEYS.language) as AppLanguage | null;
    const savedMood = bloomGetRaw(BLOOM_KEYS.mood);
    const savedPoints = bloomGetRaw(BLOOM_KEYS.points);
    const savedGoals = bloomGetJson<Goal[] | null>(BLOOM_KEYS.goals, null);
    const savedSupport = bloomGetJson<SupportMessage[] | null>(BLOOM_KEYS.supportMessages, null);
    const savedRole = bloomGetRaw(BLOOM_KEYS.userRole) as any;
    const savedUser = bloomGetJson<{ email: string; name: string } | null>(BLOOM_KEYS.currentUser, null);
    const savedGrades = bloomGetJson<Record<string, StudentGrades> | null>(BLOOM_KEYS.studentGrades, null);
    const savedMoodLogs = bloomGetJson<MoodLog[] | null>(BLOOM_KEYS.moodLogs, null);
    const savedLevels = bloomGetJson<Record<string, AlgerianLevel | null> | null>(BLOOM_KEYS.studentLevels, null);
    const savedLinkedChildren = bloomGetJson<string[] | null>(BLOOM_KEYS.linkedChildren, null);
    const savedLevelsConfig = bloomGetJson<AlgerianCycleConfig[] | null>(BLOOM_KEYS.levelsConfig, null);
    const savedCustomGames = bloomGetJson<CustomGame[] | null>(BLOOM_KEYS.customGames, null);
    const savedUsers = bloomGetJson<RegisteredUser[] | null>(BLOOM_KEYS.registeredUsers, null);
    const savedLinkCodes = bloomGetJson<Record<string, string> | null>(BLOOM_KEYS.familyLinkCodes, null);
    const savedGpaHistory = bloomGetJson<Record<string, number[]> | null>(BLOOM_KEYS.gpaHistory, null);
    const savedSections = bloomGetJson<ClassSection[] | null>(BLOOM_KEYS.sections, null);
    const savedAttendance = bloomGetJson<AttendanceRecord[] | null>(BLOOM_KEYS.attendance, null);
    const savedBehaviorNotes = bloomGetJson<BehaviorNote[] | null>(BLOOM_KEYS.behaviorNotes, null);
    const savedSchedule = bloomGetJson<ScheduleEntry[] | null>(BLOOM_KEYS.schedule, null);
    const savedParentMessages = bloomGetJson<ParentMessage[] | null>(BLOOM_KEYS.parentMessages, null);
    const savedStudyPlan = bloomGetJson<StudyPlanEntry[] | null>(BLOOM_KEYS.studyPlan, null);
    const savedPriorityTasks = bloomGetJson<PriorityTask[] | null>(BLOOM_KEYS.priorityTasks, null);
    const savedHelpRequests = bloomGetJson<HelpRequest[] | null>(BLOOM_KEYS.helpRequests, null);
    const savedDailyChallenges = bloomGetJson<DailyChallengeState | null>(BLOOM_KEYS.dailyChallenges, null);

    if (savedLang) setAppLanguageState(savedLang);
    if (savedMood) setCurrentMoodState(savedMood);
    if (savedPoints) setUserPointsState(parseInt(savedPoints, 10));
    if (savedRole) setUserRoleState(savedRole);
    if (savedUser) setCurrentUserState(savedUser);
    // Restore a role-appropriate start screen so reloads don't dump non-youth
    // roles onto the (youth) Home screen. A URL ?screen=... override still wins
    // because it is applied after this effect.
    if (savedRole) {
      setActiveScreenState(
        savedRole === "admin" ? "admin"
        : savedRole === "parent" ? "parent"
        : savedRole === "psychologist" ? "psychological"
        : "home"
      );
    }
    if (savedGrades) setStudentGradesState(savedGrades);
    if (savedMoodLogs) setMoodLogsState(savedMoodLogs);
    if (savedLevels) setStudentLevelsState(savedLevels);
    if (savedLinkedChildren) setLinkedChildrenState(savedLinkedChildren);
    if (savedLevelsConfig) setAlgerianLevels(savedLevelsConfig);
    if (savedCustomGames) setCustomGames(savedCustomGames);
    // These sections name 30 invented students and were written to the shared
    // database on first load, so a real school started with a full roster of
    // people who do not exist. Existing sections are left untouched (they may
    // be real); this only stops new ones being fabricated in production.
    if (savedSections) setTeacherSections(savedSections); else if (DEMO_SEEDING_ENABLED) { setTeacherSections(DEFAULT_SECTIONS); bloomSetJson(BLOOM_KEYS.sections, DEFAULT_SECTIONS); }
    if (savedAttendance) setAttendance(savedAttendance);
    else if (DEMO_SEEDING_ENABLED && Object.keys(studentGrades).length) { const demoAtt = seedDemoAttendance(Object.keys(studentGrades)); setAttendance(demoAtt); bloomSetJson(BLOOM_KEYS.attendance, demoAtt); }
    if (savedBehaviorNotes) setBehaviorNotes(savedBehaviorNotes);
    else if (DEMO_SEEDING_ENABLED && Object.keys(studentGrades).length) { const demoBh = seedDemoBehavior(Object.keys(studentGrades)); setBehaviorNotes(demoBh); bloomSetJson(BLOOM_KEYS.behaviorNotes, demoBh); }
    if (savedSchedule) setSchedule(savedSchedule);
    else if (DEMO_SEEDING_ENABLED) { const demoSch = seedDemoSchedule(); setSchedule(demoSch); bloomSetJson(BLOOM_KEYS.schedule, demoSch); }
    if (savedParentMessages) setParentMessages(savedParentMessages);
    if (savedStudyPlan) setStudyPlanState(savedStudyPlan);
    else if (DEMO_SEEDING_ENABLED) { const demoSp = seedDemoStudyPlan(); setStudyPlanState(demoSp); bloomSetJson(BLOOM_KEYS.studyPlan, demoSp); }
    if (savedPriorityTasks) setPriorityTasksState(savedPriorityTasks);
    else if (DEMO_SEEDING_ENABLED) { const demoPt = seedDemoPriorityTasks(); setPriorityTasksState(demoPt); bloomSetJson(BLOOM_KEYS.priorityTasks, demoPt); }
    if (savedHelpRequests) setHelpRequestsState(savedHelpRequests);
    if (savedDailyChallenges && savedDailyChallenges.date === new Date().toISOString().slice(0, 10)) setDailyChallengesState({ ...savedDailyChallenges, history: savedDailyChallenges.history ?? {} });
    if (savedUsers && savedUsers.length > 0) {
      // Migrate legacy roles: old "student" -> "youth" and old "teacher" -> "admin"
      // (the teacher role was merged into the admin/school-management role).
      // Legacy data may still contain old role strings, so read loosely.
      const parsedUsers = savedUsers.map(u => {
        const role = String(u.role);
        if (role === "student") return { ...u, role: "youth" as const };
        if (role === "teacher") return { ...u, role: "admin" as const };
        return u;
      });
      setRegisteredUsers(parsedUsers);
    } else if (DEMO_SEEDING_ENABLED) {
      // First run (development only): seed the demo accounts, with passwords
      // hashed before storage. In production this branch is skipped entirely,
      // so no known-password account is ever created in the real user list.
      seedDemoAccounts().then(seeded => {
        setRegisteredUsers(seeded);
        bloomSetJson(BLOOM_KEYS.registeredUsers, seeded);
      });
    }
    if (savedLinkCodes) setFamilyLinkCodes(savedLinkCodes);
    const savedAssignments = bloomGetJson<Record<string, StudentAssignment> | null>(BLOOM_KEYS.studentAssignments, null);
    if (savedAssignments) setStudentAssignmentsState(savedAssignments);
    const savedTerm = bloomGetRaw(BLOOM_KEYS.activeTerm) as TermId | null;
    if (savedTerm) setActiveTermState(savedTerm);
    const savedTrimGrades = bloomGetJson<TrimesterGradesMap | null>(BLOOM_KEYS.trimesterGrades, null);
    if (savedTrimGrades) setTrimesterGradesState(savedTrimGrades);
    else if (DEMO_SEEDING_ENABLED && Object.keys(studentGrades).length) { const demoTrim = seedDemoTrimesters(Object.keys(studentGrades)); setTrimesterGradesState(demoTrim); bloomSetJson(BLOOM_KEYS.trimesterGrades, demoTrim); }
    if (savedGpaHistory) setGpaHistoryState(savedGpaHistory);
    else if (DEMO_SEEDING_ENABLED) {
      // Backfills two invented prior GPA points per student. Real history
      // accumulates from actual snapshots, so this stays development-only.
      const hist: Record<string, number[]> = {};
      Object.keys(studentGrades).forEach((name) => {
        const g = studentGrades[name] || {};
        const keys = Object.keys(g);
        if (!keys.length) return;
        const avg = keys.reduce((a, k) => a + g[k], 0) / keys.length;
        hist[name] = [parseFloat((avg - 1).toFixed(1)), parseFloat((avg - 0.5).toFixed(1)), parseFloat(avg.toFixed(1))];
      });
      if (Object.keys(hist).length) { setGpaHistoryState(hist); bloomSetJson(BLOOM_KEYS.gpaHistory, hist); }
    }

    if (savedGoals) {
      setGoalsState(savedGoals);
    } else if (DEMO_SEEDING_ENABLED) {
      // Seed default goals (development only)
      const defaultGoals: Goal[] = [
        { id: "1", title: "goal_math", currentProgress: 4, targetProgress: 5 },
        { id: "2", title: "goal_reading", currentProgress: 20, targetProgress: 20 },
        { id: "3", title: "goal_exercises", currentProgress: 2, targetProgress: 3 },
        { id: "4", title: "goal_water", currentProgress: 5, targetProgress: 7 },
        { id: "5", title: "goal_sport", currentProgress: 1, targetProgress: 3 }
      ];
      setGoalsState(defaultGoals);
      bloomSetJson(BLOOM_KEYS.goals, defaultGoals);
    }

    if (savedSupport) setSupportMessagesState(savedSupport);
  }, []);

  // Update HTML dir and lang attributes on changes
  useEffect(() => {
    if (!mounted) return;
    const isRtl = appLanguage === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = appLanguage;
  }, [appLanguage, mounted]);

  // Auth operations
  const login = async (email: string, password: string): Promise<boolean> => {
    const emailLower = email.toLowerCase().trim();

    // The demo fixture has published passwords. Any demo account that reached
    // the live user list before the seeding gate existed is still a working
    // credential, so the identity is refused outright in production rather
    // than relying on those rows having been cleaned up.
    if (process.env.NODE_ENV === "production" && isDemoAccountEmail(emailLower)) {
      console.warn(`[login] refused demo account in production: ${emailLower}`);
      return false;
    }

    const foundUser = registeredUsers.find(
      u => u.email.toLowerCase() === emailLower
    );

    if (!foundUser || !(await verifyPassword(password, foundUser))) {
      return false;
    }

    // Migrate legacy plaintext accounts to hashed credentials on success.
    if (foundUser.password && !foundUser.hash) {
      const credential = await createCredential(password);
      const migrated: RegisteredUser = {
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        salt: credential.salt,
        hash: credential.hash
      };
      const nextUsers = registeredUsers.map(u =>
        u.email === foundUser.email ? migrated : u
      );
      setRegisteredUsers(nextUsers);
      bloomSetJson(BLOOM_KEYS.registeredUsers, nextUsers);
    }

    const { role, name } = foundUser;
    const userObj = { email: foundUser.email, name };
    setUserRoleState(role);
    setCurrentUserState(userObj);
    bloomSetRaw(BLOOM_KEYS.userRole, role || "");
    bloomSetJson(BLOOM_KEYS.currentUser, userObj);

    if (role === "parent") {
      setParentAuthenticatedState(true);
      setActiveScreenState("parent");
    } else if (role === "admin") {
      setActiveScreenState("admin");
    } else if (role === "psychologist") {
      setActiveScreenState("psychological");
    } else if (role === "youth") {
      setActiveScreenState("home");
    } else {
      setActiveScreenState("home");
    }
    return true;
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    role: "youth" | "parent" | "psychologist" | "admin"
  ): Promise<{ success: boolean; error?: string }> => {
    const emailLower = email.toLowerCase().trim();
    const nameTrimmed = name.trim();
    if (!emailLower || !password.trim() || !nameTrimmed) {
      return { success: false, error: "register_error_required" };
    }

    const exists = registeredUsers.some(u => u.email.toLowerCase() === emailLower);
    if (exists) {
      return { success: false, error: "register_error_exists" };
    }

    const credential = await createCredential(password.trim());
    const newUser: RegisteredUser = {
      email: email.trim(),
      name: nameTrimmed,
      role,
      salt: credential.salt,
      hash: credential.hash
    };

    const nextUsers = [...registeredUsers, newUser];
    setRegisteredUsers(nextUsers);
    // bloomSetJson mirrors to the server; flush now so the account is durable
    // before the UI reports success (a localStorage-only account is discarded
    // on the next page load, because boot hydration lets the server win).
    bloomSetJson(BLOOM_KEYS.registeredUsers, nextUsers);
    await bloomSyncNow();

    return { success: true };
  };

  const logout = () => {
    setUserRoleState(null);
    setCurrentUserState(null);
    bloomRemove(BLOOM_KEYS.userRole);
    bloomRemove(BLOOM_KEYS.currentUser);
    setParentAuthenticatedState(false);
    // Re-read today's usage instead of refilling the budget: resetting to the
    // full limit here let anyone bypass the parental time limit by logging out
    // and back in.
    kidRemainingRef.current = getKidRemainingMs();
    setKidRemainingMs(getKidRemainingMs());
    setActiveScreenState("home");
  };

  // Level operations
  const updateStudentLevel = (student: string, level: AlgerianLevel) => {
    const updated = { ...studentLevels, [student]: level };
    setStudentLevelsState(updated);
    bloomSetJson(BLOOM_KEYS.studentLevels, updated);
  };

  // Link child by family code
  const linkChildAccount = (code: string): { success: boolean; childName?: string } => {
    const entry = Object.entries(familyLinkCodes).find(([, c]) => c.toUpperCase() === code.trim().toUpperCase());
    if (!entry) return { success: false };
    const [childName] = entry;
    if (linkedChildren.includes(childName)) return { success: true, childName };
    const updated = [...linkedChildren, childName];
    setLinkedChildrenState(updated);
    bloomSetJson(BLOOM_KEYS.linkedChildren, updated);
    return { success: true, childName };
  };

  // Grade operations
  const updateGrade = (student: string, subject: string, grade: number) => {
    const updated = {
      ...studentGrades,
      [student]: {
        ...studentGrades[student],
        [subject]: grade
      }
    };
    setStudentGradesState(updated);
    bloomSetJson(BLOOM_KEYS.studentGrades, updated);
  };

  // Records a GPA snapshot for a student so the parent dashboard shows a real
  // trend instead of hardcoded history. Skips duplicate values.
  const recordGpaSnapshot = (student: string) => {
    const grades = studentGrades[student];
    if (!grades) return;
    const keys = Object.keys(grades);
    if (keys.length === 0) return;
    const avg = parseFloat(
      (keys.reduce((acc, k) => acc + grades[k], 0) / keys.length).toFixed(2)
    );
    const prev = gpaHistory[student] || [];
    if (prev.length > 0 && prev[prev.length - 1] === avg) return;
    const updated = { ...gpaHistory, [student]: [...prev, avg].slice(-8) };
    setGpaHistoryState(updated);
    bloomSetJson(BLOOM_KEYS.gpaHistory, updated);
  };

  // ---- Teacher portal operations ----
  const updateTeacherSection = (updated: ClassSection) => {
    const next = teacherSections.map(s => s.id === updated.id ? updated : s);
    setTeacherSections(next);
    bloomSetJson(BLOOM_KEYS.sections, next);
  };

  const addStudentToSection = (sectionId: string, name: string) => {
    const next = teacherSections.map(s =>
      s.id === sectionId ? { ...s, studentNames: [...s.studentNames, name] } : s
    );
    setTeacherSections(next);
    bloomSetJson(BLOOM_KEYS.sections, next);
  };

  const removeStudentFromSection = (sectionId: string, name: string) => {
    const next = teacherSections.map(s =>
      s.id === sectionId ? { ...s, studentNames: s.studentNames.filter(n => n !== name) } : s
    );
    setTeacherSections(next);
    bloomSetJson(BLOOM_KEYS.sections, next);
  };

  // Generate a unique family link code for a student (format BLM-XXXX).
  const genFamilyCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `BLM-${code}`;
  };

  // Admin creates a student account: registers them in grades, generates a
  // family link code parents can use to start monitoring, and adds them to the
  // first available class section so they show up for teachers too.
  const createStudentAccount = (name: string): { success: boolean; code?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false };
    const existingCodes = Object.values(familyLinkCodes);
    let code = genFamilyCode();
    while (existingCodes.some(c => c === code)) code = genFamilyCode();

    const nextGrades = { ...studentGrades, [trimmed]: studentGrades[trimmed] || {} };
    setStudentGradesState(nextGrades);
    bloomSetJson(BLOOM_KEYS.studentGrades, nextGrades);

    const nextCodes = { ...familyLinkCodes, [trimmed]: code };
    setFamilyLinkCodes(nextCodes);
    bloomSetJson(BLOOM_KEYS.familyLinkCodes, nextCodes);

    // Ensure a default level exists so the student is immediately usable.
    if (!studentLevels[trimmed]) {
      const defaultLevel = { cycle: "moyen" as const, year: 1, label: "1AM" };
      const nextLevels = { ...studentLevels, [trimmed]: defaultLevel };
      setStudentLevelsState(nextLevels);
      bloomSetJson(BLOOM_KEYS.studentLevels, nextLevels);
    }

    // Add to the first section if not already in any section.
    if (!teacherSections.some(s => s.studentNames.includes(trimmed))) {
      const first = teacherSections[0];
      if (first) {
        const next = teacherSections.map(s =>
          s.id === first.id ? { ...s, studentNames: [...s.studentNames, trimmed] } : s
        );
        setTeacherSections(next);
        bloomSetJson(BLOOM_KEYS.sections, next);
      }
    }

    return { success: true, code };
  };

  const regenerateFamilyCode = (name: string): string => {
    const existingCodes = Object.values(familyLinkCodes);
    let code = genFamilyCode();
    while (existingCodes.some(c => c === code)) code = genFamilyCode();
    const nextCodes = { ...familyLinkCodes, [name]: code };
    setFamilyLinkCodes(nextCodes);
    bloomSetJson(BLOOM_KEYS.familyLinkCodes, nextCodes);
    return code;
  };

  const markAttendance = (records: Omit<AttendanceRecord, "date">[], date: string) => {
    const dateStr = date || new Date().toISOString().slice(0, 10);
    const next = attendance.filter(r => r.date !== dateStr || r.sectionId !== records[0]?.sectionId);
    const merged = [...next, ...records.map(r => ({ ...r, date: dateStr }))];
    setAttendance(merged);
    bloomSetJson(BLOOM_KEYS.attendance, merged);
  };

  const getAttendanceForSection = (sectionId: string, date: string) => {
    return attendance.filter(r => r.sectionId === sectionId && r.date === date);
  };

  const getAttendanceForStudent = (studentName: string) => {
    return attendance.filter(r => r.studentName === studentName);
  };

  const addBehaviorNote = (note: Omit<BehaviorNote, "id" | "date">) => {
    const entry: BehaviorNote = {
      ...note,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString().slice(0, 10),
    };
    const next = [entry, ...behaviorNotes];
    setBehaviorNotes(next);
    bloomSetJson(BLOOM_KEYS.behaviorNotes, next);
  };

  const deleteBehaviorNote = (id: string) => {
    const next = behaviorNotes.filter(n => n.id !== id);
    setBehaviorNotes(next);
    bloomSetJson(BLOOM_KEYS.behaviorNotes, next);
  };

  const getBehaviorForStudent = (studentName: string) => {
    return behaviorNotes.filter(n => n.studentName === studentName);
  };

  const addScheduleEntry = (entry: Omit<ScheduleEntry, "id">) => {
    const e: ScheduleEntry = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    const next = [...schedule, e];
    setSchedule(next);
    bloomSetJson(BLOOM_KEYS.schedule, next);
  };

  const removeScheduleEntry = (id: string) => {
    const next = schedule.filter(e => e.id !== id);
    setSchedule(next);
    bloomSetJson(BLOOM_KEYS.schedule, next);
  };

  const getScheduleForDay = (day: number) => {
    return schedule.filter(e => e.day === day);
  };

  const sendParentMessage = (msg: Omit<ParentMessage, "id" | "date">) => {
    const m: ParentMessage = {
      ...msg,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
    };
    const next = [m, ...parentMessages];
    setParentMessages(next);
    bloomSetJson(BLOOM_KEYS.parentMessages, next);
  };

  const markMessageRead = (id: string) => {
    const next = parentMessages.map(m => m.id === id ? { ...m, read: true } : m);
    setParentMessages(next);
    bloomSetJson(BLOOM_KEYS.parentMessages, next);
  };

  const getMessagesForStudent = (studentName: string) => {
    return parentMessages.filter(m => m.studentName === studentName);
  };

  const getUnreadParentMessages = () => {
    return parentMessages.filter(m => m.from === "parent" && !m.read);
  };

  // ---- Student planner operations ----
  const addStudyPlanEntry = (entry: Omit<StudyPlanEntry, "id" | "done">) => {
    const e: StudyPlanEntry = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), done: false };
    const next = [...studyPlan, e];
    setStudyPlanState(next);
    bloomSetJson(BLOOM_KEYS.studyPlan, next);
  };

  const removeStudyPlanEntry = (id: string) => {
    const next = studyPlan.filter(e => e.id !== id);
    setStudyPlanState(next);
    bloomSetJson(BLOOM_KEYS.studyPlan, next);
  };

  const toggleStudyPlanDone = (id: string) => {
    const next = studyPlan.map(e => e.id === id ? { ...e, done: !e.done } : e);
    setStudyPlanState(next);
    bloomSetJson(BLOOM_KEYS.studyPlan, next);
  };

  // ---- Student priority tasks ----
  const addPriorityTask = (task: Omit<PriorityTask, "id">) => {
    const t: PriorityTask = { ...task, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    const next = [...priorityTasks, t];
    setPriorityTasksState(next);
    bloomSetJson(BLOOM_KEYS.priorityTasks, next);
  };

  const removePriorityTask = (id: string) => {
    const next = priorityTasks.filter(t => t.id !== id);
    setPriorityTasksState(next);
    bloomSetJson(BLOOM_KEYS.priorityTasks, next);
  };

  const togglePriorityTask = (id: string) => {
    const next = priorityTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setPriorityTasksState(next);
    bloomSetJson(BLOOM_KEYS.priorityTasks, next);
  };

  // ---- Student help requests (surfaced to the parent as an alert) ----
  const requestHelp = (message: string) => {
    const student = currentUser?.name || "Sara";
    const r: HelpRequest = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      student,
      message,
      timestamp: new Date().toISOString(),
    };
    const next = [r, ...helpRequests];
    setHelpRequestsState(next);
    bloomSetJson(BLOOM_KEYS.helpRequests, next);
  };

  // ---- Daily learning challenges ----
  const toggleDailyChallenge = (taskId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (dailyChallenges.date !== today) {
      const fresh: DailyChallengeState = { date: today, tasks: DEFAULT_DAILY_TASKS.map(t => ({ ...t })), history: { ...(dailyChallenges.history ?? {}) } };
      setDailyChallengesState(fresh);
      bloomSetJson(BLOOM_KEYS.dailyChallenges, fresh);
      return;
    }
    const target = dailyChallenges.tasks.find(t => t.id === taskId);
    if (target && !target.done) addPoints(20);
    const tasks = dailyChallenges.tasks.map(t => t.id === taskId ? { ...t, done: true } : t);
    const history = { ...(dailyChallenges.history ?? {}) };
    if (tasks.every(t => t.done)) history[today] = true;
    const next = { date: today, tasks, history };
    setDailyChallengesState(next);
    bloomSetJson(BLOOM_KEYS.dailyChallenges, next);
  };

  // Mood operations
  // addMoodLog was removed: it had zero call sites, and setCurrentMood is now
  // the only path by which a mood log can exist. Keeping both would leave two
  // ways to write the same record with different shapes.

  // Guidance notes operations
  const assignStudentRoles = (studentName: string, assignments: StudentAssignment) => {
    const next = {
      ...studentAssignments,
      [studentName]: {
        parents: [...new Set(assignments.parents || [])],
        psychologists: [...new Set(assignments.psychologists || [])]
      }
    };
    setStudentAssignmentsState(next);
    bloomSetJson(BLOOM_KEYS.studentAssignments, next);
  };

  // Record (or clear) the psychologist's risk flag for one student.
  const setStudentRisk = (studentName: string, level: StudentRiskLevel, note: string) => {
    const trimmed = note.trim();
    const next = { ...studentRisks };
    if (!trimmed && level === "low") {
      // An empty note at the lowest level means "no concern" - drop the flag.
      delete next[studentName];
    } else {
      next[studentName] = {
        level,
        note: trimmed,
        updatedAt: new Date().toISOString()
      };
    }
    setStudentRisksState(next);
    bloomSetJson(BLOOM_KEYS.studentRisks, next);
  };

  const setActiveTerm = (term: TermId) => {
    setActiveTermState(term);
    bloomSetRaw(BLOOM_KEYS.activeTerm, term);
  };

  const getTermGrades = (student: string, term: TermId): StudentGrades =>
    trimesterGrades[student]?.[term] || studentGrades[student] || {};

  const updateTermGrade = (student: string, term: TermId, subject: string, value: number) => {
    const book = trimesterGrades[student]?.[term] || studentGrades[student] || {};
    const updatedTerm = { ...book, [subject]: value };
    const next = {
      ...trimesterGrades,
      [student]: { ...(trimesterGrades[student] || {}), [term]: updatedTerm }
    };
    setTrimesterGradesState(next);
    bloomSetJson(BLOOM_KEYS.trimesterGrades, next);
  };

  const updateGuidanceNotes = (student: string, notes: string[]) => {
    const updated = { ...guidanceNotes, [student]: notes };
    setGuidanceNotesState(updated);
    bloomSetJson(BLOOM_KEYS.guidanceNotes, updated);
  };

  // Learning & gratitude journal operations
  const updateLearningEntries = (entries: LearningEntry[]) => {
    setLearningEntriesState(entries);
    bloomSetJson(BLOOM_KEYS.learningEntries, entries);
  };

  const updateGratitudeEntries = (entries: GratitudeEntry[]) => {
    setGratitudeEntriesState(entries);
    bloomSetJson(BLOOM_KEYS.gratitudeEntries, entries);
  };

  // Account management
  const deleteRegisteredUser = (email: string) => {
    // Compare case-insensitively: accounts are stored with the case the user
    // typed, so a case-sensitive match would silently fail to delete.
    const target = email.toLowerCase().trim();
    const updated = registeredUsers.filter(r => r.email.toLowerCase().trim() !== target);
    setRegisteredUsers(updated);
    bloomSetJson(BLOOM_KEYS.registeredUsers, updated);
  };

  // Dynamic levels/tracks & Custom Games operations
  const addCustomTrack = (cycle: AlgerianCycle, year: number, trackName: string) => {
    const updated = algerianLevels.map(c => {
      if (c.cycle === cycle) {
        const nextYears = c.years.map(y => {
          if (y.year === year) {
            const nextTracks = y.tracks ? [...y.tracks, trackName] : [trackName];
            return { ...y, tracks: nextTracks };
          }
          return y;
        });
        return { ...c, years: nextYears };
      }
      return c;
    });
    setAlgerianLevels(updated);
    bloomSetJson(BLOOM_KEYS.levelsConfig, updated);
  };

  const addCustomYear = (cycle: AlgerianCycle, label: string) => {
    const updated = algerianLevels.map(c => {
      if (c.cycle === cycle) {
        const nextYearNum = c.years.length + 1;
        const newYear: AlgerianYear = { year: nextYearNum, label };
        return { ...c, years: [...c.years, newYear] };
      }
      return c;
    });
    setAlgerianLevels(updated);
    bloomSetJson(BLOOM_KEYS.levelsConfig, updated);
  };

  const addCustomGame = (game: Omit<CustomGame, "id">) => {
    const newGame: CustomGame = {
      ...game,
      id: Date.now().toString()
    };
    const updated = [...customGames, newGame];
    setCustomGames(updated);
    bloomSetJson(BLOOM_KEYS.customGames, updated);
  };

  // Persisting wrapper functions
  const setAppLanguage = (lang: AppLanguage) => {
    setAppLanguageState(lang);
    bloomSetRaw(BLOOM_KEYS.language, lang);
  };

  // Mood operations.
  // setCurrentMood is the single writer of mood history: any mood selection
  // anywhere in the app now produces a dated, per-student record. Previously it
  // only overwrote one scalar, so no user action could ever create a log and
  // every mood-derived surface was frozen on hardcoded seed data.
  const setCurrentMood = (mood: string) => {
    setCurrentMoodState(mood);
    bloomSetRaw(BLOOM_KEYS.mood, mood);

    const student = currentUser?.name || "Sara";
    const now = Date.now();
    // Guard against a child tapping an emoji repeatedly manufacturing a trend.
    if (!shouldLogMood(moodLogs, student, mood, now)) return;
    const next = appendMoodLog(moodLogs, student, mood, now);
    setMoodLogsState(next);
    bloomSetJson(BLOOM_KEYS.moodLogs, next);
  };

  const addPoints = (points: number) => {
    const nextPoints = userPoints + points;
    setUserPointsState(nextPoints);
    bloomSetRaw(BLOOM_KEYS.points, String(nextPoints));
  };

  const addGoal = (title: string, target: number, studentName?: string, period: GoalPeriod = "weekly") => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      currentProgress: 0,
      targetProgress: target,
      studentName,
      period
    };
    const nextGoals = [...goals, newGoal];
    setGoalsState(nextGoals);
    bloomSetJson(BLOOM_KEYS.goals, nextGoals);
  };

  const incrementGoalProgress = (id: string) => {
    const nextGoals = goals.map(goal => {
      if (goal.id === id) {
        const nextProg = Math.min(goal.currentProgress + 1, goal.targetProgress);
        // Award points if completing a goal
        if (nextProg === goal.targetProgress && goal.currentProgress < goal.targetProgress) {
          addPoints(100); // 100 points reward for goal completion
        }
        return { ...goal, currentProgress: nextProg };
      }
      return goal;
    });
    setGoalsState(nextGoals);
    bloomSetJson(BLOOM_KEYS.goals, nextGoals);
  };

  const deleteGoal = (id: string) => {
    const nextGoals = goals.filter(g => g.id !== id);
    setGoalsState(nextGoals);
    bloomSetJson(BLOOM_KEYS.goals, nextGoals);
  };

  const setActiveScreen = (screen: string) => {
    setActiveScreenState(screen);
    setDrawerOpenState(false); // Auto-close drawer on navigation
  };

  const setDrawerOpen = (open: boolean) => {
    setDrawerOpenState(open);
  };

  const setParentAuthenticated = (auth: boolean) => {
    setParentAuthenticatedState(auth);
  };

  const sendSupportMessage = (to: string, msg: string) => {
    const newMsg: SupportMessage = {
      id: Date.now().toString(),
      toChild: to,
      message: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextMsgs = [newMsg, ...supportMessages];
    setSupportMessagesState(nextMsgs);
    bloomSetJson(BLOOM_KEYS.supportMessages, nextMsgs);
  };

  // Translation function helper
  const t = (key: string, ...args: (string | number)[]): string => {
    const locales = localesData as any;
    const langPack = locales[appLanguage] || locales["en"] || {};
    let text = langPack[key] || locales["en"]?.[key] || key;

    // Clean up escaped quotes
    text = text.replace(/\\'/g, "'");

    // Format strings (e.g., %1$s, %1$d, %2$d)
    text = text.replace(/%(\d+)\$[sd]/g, (match: string, indexStr: string) => {
      const index = parseInt(indexStr, 10) - 1;
      if (index >= 0 && index < args.length) {
        const arg = args[index];
        // Translate argument if it's a translation key itself
        if (typeof arg === "string" && (langPack[arg] || locales["en"]?.[arg])) {
          return langPack[arg] || locales["en"]?.[arg];
        }
        return String(arg);
      }
      return match;
    });

    return text;
  };

  const isRtl = appLanguage === "ar";


  return (
    <BloomContext.Provider
         value={{
           appLanguage,
           currentMood,
        userPoints,
        goals,
        activeScreen,
        drawerOpen,
        parentAuthenticated,
        parentAlerts,
        supportMessages,
        registeredUsers,
        kidRemainingMs,
        getKidRemainingMs,
        userRole,
        currentUser,
        login,
        register,
        logout,
        studentGrades,
        updateGrade,
        gpaHistory,
        recordGpaSnapshot,
        teacherSections,
        updateTeacherSection,
        addStudentToSection,
        removeStudentFromSection,
        createStudentAccount,
        regenerateFamilyCode,
        attendance,
        markAttendance,
        getAttendanceForSection,
        getAttendanceForStudent,
        behaviorNotes,
        addBehaviorNote,
        deleteBehaviorNote,
        getBehaviorForStudent,
        schedule,
        addScheduleEntry,
        removeScheduleEntry,
        getScheduleForDay,
        parentMessages,
        sendParentMessage,
        markMessageRead,
        getMessagesForStudent,
        getUnreadParentMessages,
        studyPlan,
        addStudyPlanEntry,
        removeStudyPlanEntry,
        toggleStudyPlanDone,
        priorityTasks,
        addPriorityTask,
        removePriorityTask,
        togglePriorityTask,
        helpRequests,
        requestHelp,
        dailyChallenges,
        toggleDailyChallenge,
        challengeStreak,
        challengeBestStreak,
        studentLevels,
        updateStudentLevel,
        familyLinkCodes,
        linkedChildren,
        linkChildAccount,
        studentAssignments,
        assignStudentRoles,
        studentRisks,
        setStudentRisk,
        activeTerm,
        setActiveTerm,
        trimesterGrades,
        updateTermGrade,
        getTermGrades,
        moodLogs,
        guidanceNotes,
        updateGuidanceNotes,
        learningEntries,
        updateLearningEntries,
        gratitudeEntries,
        updateGratitudeEntries,
        deleteRegisteredUser,
        algerianLevels,
        addCustomTrack,
        addCustomYear,
        customGames,
           addCustomGame,
           setAppLanguage,
           setCurrentMood,
        addPoints,
        addGoal,
        incrementGoalProgress,
        deleteGoal,
        setActiveScreen,
        setDrawerOpen,
        setParentAuthenticated,
        sendSupportMessage,
        t,
        isRtl,
      }}
    >
      {children}
    </BloomContext.Provider>
  );
};

export const useBloom = () => {
  const context = useContext(BloomContext);
  if (!context) {
    throw new Error("useBloom must be used within a BloomProvider");
  }
  return context;
};
