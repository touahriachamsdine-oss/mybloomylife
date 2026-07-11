"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import localesData from "../app/locales.json";

export type ThemeMode = "CALM" | "DARK" | "MOTIVATING";
export type AppLanguage = "ar" | "en" | "fr" | "kab";

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
}

export interface ParentAlert {
  id: string;
  type: "math" | "goal_completed" | "challenge" | "fatigue";
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

export interface MoodLog {
  id: string;
  student: string;
  mood: string;
  timestamp: string;
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

interface BloomContextType {
  themeMode: ThemeMode;
  appLanguage: AppLanguage;
  currentMood: string; // key like "mood_calm"
  userPoints: number;
  goals: Goal[];
  activeScreen: string;
  drawerOpen: boolean;
  parentAuthenticated: boolean;
  parentAlerts: ParentAlert[];
  supportMessages: SupportMessage[];
  
  // Auth state
  userRole: "student" | "parent" | "teacher" | "psychologist" | "admin" | null;
  currentUser: { username: string; name: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // Grade state
  studentGrades: {
    Sara: StudentGrades;
    Ahmed: StudentGrades;
  };
  updateGrade: (student: "Sara" | "Ahmed", subject: string, grade: number) => void;

  // Algerian level system
  studentLevels: { Sara: AlgerianLevel | null; Ahmed: AlgerianLevel | null };
  updateStudentLevel: (student: "Sara" | "Ahmed", level: AlgerianLevel) => void;

  // Family linking
  familyLinkCodes: Record<string, string>;
  linkedChildren: string[];
  linkChildAccount: (code: string) => { success: boolean; childName?: string };

  // Mood history logs
  moodLogs: MoodLog[];
  addMoodLog: (student: string, mood: string) => void;

  // Dynamic levels/tracks & Custom Games
  algerianLevels: AlgerianCycleConfig[];
  addCustomTrack: (cycle: AlgerianCycle, year: number, trackName: string) => void;
  addCustomYear: (cycle: AlgerianCycle, label: string) => void;
  customGames: CustomGame[];
  addCustomGame: (game: Omit<CustomGame, "id">) => void;

  // Setters/Action functions
  setThemeMode: (mode: ThemeMode) => void;
  setAppLanguage: (lang: AppLanguage) => void;
  setCurrentMood: (mood: string) => void;
  addPoints: (points: number) => void;
  addGoal: (title: string, target: number) => void;
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


export const BloomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global States
  const [themeMode, setThemeModeState] = useState<ThemeMode>("CALM");
  const [appLanguage, setAppLanguageState] = useState<AppLanguage>("ar");
  const [currentMood, setCurrentMoodState] = useState<string>("mood_calm");
  const [userPoints, setUserPointsState] = useState<number>(2350);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [activeScreen, setActiveScreenState] = useState<string>("home");
  const [drawerOpen, setDrawerOpenState] = useState<boolean>(false);
  const [parentAuthenticated, setParentAuthenticatedState] = useState<boolean>(false);
  const [supportMessages, setSupportMessagesState] = useState<SupportMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  // Auth state
  const [userRole, setUserRoleState] = useState<"student" | "parent" | "teacher" | "psychologist" | "admin" | null>(null);
  const [currentUser, setCurrentUserState] = useState<{ username: string; name: string } | null>(null);

  // Grades state (Algerian subjects & 20-point scale grades)
  const [studentGrades, setStudentGradesState] = useState<{
    Sara: StudentGrades;
    Ahmed: StudentGrades;
  }>({
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

  // Algerian level state (persisted)
  const [studentLevels, setStudentLevelsState] = useState<{ Sara: AlgerianLevel | null; Ahmed: AlgerianLevel | null }>(
    { Sara: null, Ahmed: null }
  );

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

  // Family link codes — static per student for the demo
  const familyLinkCodes: Record<string, string> = { Sara: "BLM-7X4", Ahmed: "BLM-9K2" };

  // Parent's linked children list (persisted)
  const [linkedChildren, setLinkedChildrenState] = useState<string[]>([]);

  // Mood logs state
  const [moodLogs, setMoodLogsState] = useState<MoodLog[]>([
    { id: "1", student: "Sara", mood: "mood_happy", timestamp: "10:30 AM" },
    { id: "2", student: "Ahmed", mood: "mood_calm", timestamp: "09:15 AM" },
    { id: "3", student: "Sara", mood: "mood_anxious", timestamp: "Yesterday" },
    { id: "4", student: "Ahmed", mood: "mood_sad", timestamp: "Yesterday" }
  ]);

  // Default seeded goals & alerts
  const [parentAlerts, setParentAlerts] = useState<ParentAlert[]>([
    { id: "1", type: "math", childName: "parent_child_sara", timeValue: 2, isDays: false },
    { id: "2", type: "goal_completed", childName: "parent_child_sara", timeValue: 5, isDays: false },
    { id: "3", type: "challenge", childName: "parent_child_ahmed", timeValue: 1, isDays: true },
    { id: "4", type: "fatigue", childName: "parent_child_ahmed", timeValue: 3, isDays: false }
  ]);

  // Handle SSR mounting
  useEffect(() => {
    setMounted(true);
    // Load from localStorage if present
    const savedTheme = localStorage.getItem("bloom_theme_mode") as ThemeMode;
    const savedLang = localStorage.getItem("bloom_language") as AppLanguage;
    const savedMood = localStorage.getItem("bloom_mood");
    const savedPoints = localStorage.getItem("bloom_points");
    const savedGoals = localStorage.getItem("bloom_goals");
    const savedSupport = localStorage.getItem("bloom_support_messages");
    const savedRole = localStorage.getItem("bloom_user_role") as any;
    const savedUser = localStorage.getItem("bloom_current_user");
    const savedGrades = localStorage.getItem("bloom_student_grades");
    const savedMoodLogs = localStorage.getItem("bloom_mood_logs");
    const savedLevels = localStorage.getItem("bloom_student_levels");
    const savedLinkedChildren = localStorage.getItem("bloom_linked_children");
    const savedLevelsConfig = localStorage.getItem("bloom_levels_config");
    const savedCustomGames = localStorage.getItem("bloom_custom_games");

    if (savedTheme) setThemeModeState(savedTheme);
    if (savedLang) setAppLanguageState(savedLang);
    if (savedMood) setCurrentMoodState(savedMood);
    if (savedPoints) setUserPointsState(parseInt(savedPoints, 10));
    if (savedRole) setUserRoleState(savedRole);
    if (savedUser) setCurrentUserState(JSON.parse(savedUser));
    if (savedGrades) setStudentGradesState(JSON.parse(savedGrades));
    if (savedMoodLogs) setMoodLogsState(JSON.parse(savedMoodLogs));
    if (savedLevels) setStudentLevelsState(JSON.parse(savedLevels));
    if (savedLinkedChildren) setLinkedChildrenState(JSON.parse(savedLinkedChildren));
    if (savedLevelsConfig) setAlgerianLevels(JSON.parse(savedLevelsConfig));
    if (savedCustomGames) setCustomGames(JSON.parse(savedCustomGames));
    
    if (savedGoals) {
      setGoalsState(JSON.parse(savedGoals));
    } else {
      // Seed default goals
      const defaultGoals: Goal[] = [
        { id: "1", title: "goal_math", currentProgress: 4, targetProgress: 5 },
        { id: "2", title: "goal_reading", currentProgress: 20, targetProgress: 20 },
        { id: "3", title: "goal_exercises", currentProgress: 2, targetProgress: 3 },
        { id: "4", title: "goal_water", currentProgress: 5, targetProgress: 7 },
        { id: "5", title: "goal_sport", currentProgress: 1, targetProgress: 3 }
      ];
      setGoalsState(defaultGoals);
      localStorage.setItem("bloom_goals", JSON.stringify(defaultGoals));
    }

    if (savedSupport) setSupportMessagesState(JSON.parse(savedSupport));
  }, []);

  // Update HTML data-theme, dir, and lang attributes on changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const isRtl = appLanguage === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = appLanguage;
  }, [appLanguage, mounted]);

  // Auth operations
  const login = (username: string, password: string): boolean => {
    if (password !== "123" && !(username === "parent" && password === "1234")) {
      return false;
    }

    let role: "student" | "parent" | "teacher" | "psychologist" | "admin" | null = null;
    let name = "";

    const userLower = username.toLowerCase();
    if (userLower === "student" || userLower === "sara") {
      role = "student";
      name = "Sara";
    } else if (userLower === "ahmed") {
      role = "student";
      name = "Ahmed";
    } else if (userLower === "parent" || userLower === "papa") {
      role = "parent";
      name = "Abu Sara";
      setParentAuthenticatedState(true);
    } else if (userLower === "teacher" || userLower === "prof") {
      role = "teacher";
      name = "Professor Ali";
    } else if (userLower === "psychologist" || userLower === "psy" || userLower === "laila") {
      role = "psychologist";
      name = "Dr. Laila";
    } else if (userLower === "admin") {
      role = "admin";
      name = "System Admin";
    } else {
      return false;
    }

    const userObj = { username, name };
    setUserRoleState(role);
    setCurrentUserState(userObj);
    localStorage.setItem("bloom_user_role", role || "");
    localStorage.setItem("bloom_current_user", JSON.stringify(userObj));
    
    // Default appropriate screen
    if (role === "parent") {
      setActiveScreenState("parent");
    } else if (role === "admin") {
      setActiveScreenState("admin");
    } else if (role === "teacher" || role === "psychologist") {
      setActiveScreenState("academic");
    } else {
      setActiveScreenState("home");
    }
    return true;
  };

  const logout = () => {
    setUserRoleState(null);
    setCurrentUserState(null);
    localStorage.removeItem("bloom_user_role");
    localStorage.removeItem("bloom_current_user");
    setParentAuthenticatedState(false);
    setActiveScreenState("home");
  };

  // Level operations
  const updateStudentLevel = (student: "Sara" | "Ahmed", level: AlgerianLevel) => {
    const updated = { ...studentLevels, [student]: level };
    setStudentLevelsState(updated);
    localStorage.setItem("bloom_student_levels", JSON.stringify(updated));
  };

  // Link child by family code
  const linkChildAccount = (code: string): { success: boolean; childName?: string } => {
    const entry = Object.entries(familyLinkCodes).find(([, c]) => c.toUpperCase() === code.trim().toUpperCase());
    if (!entry) return { success: false };
    const [childName] = entry;
    if (linkedChildren.includes(childName)) return { success: true, childName };
    const updated = [...linkedChildren, childName];
    setLinkedChildrenState(updated);
    localStorage.setItem("bloom_linked_children", JSON.stringify(updated));
    return { success: true, childName };
  };

  // Grade operations
  const updateGrade = (student: "Sara" | "Ahmed", subject: string, grade: number) => {
    const updated = {
      ...studentGrades,
      [student]: {
        ...studentGrades[student],
        [subject]: grade
      }
    };
    setStudentGradesState(updated);
    localStorage.setItem("bloom_student_grades", JSON.stringify(updated));
  };

  // Mood operations
  const addMoodLog = (student: string, mood: string) => {
    const newLog: MoodLog = {
      id: Date.now().toString(),
      student,
      mood,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextLogs = [newLog, ...moodLogs];
    setMoodLogsState(nextLogs);
    localStorage.setItem("bloom_mood_logs", JSON.stringify(nextLogs));
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
    localStorage.setItem("bloom_levels_config", JSON.stringify(updated));
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
    localStorage.setItem("bloom_levels_config", JSON.stringify(updated));
  };

  const addCustomGame = (game: Omit<CustomGame, "id">) => {
    const newGame: CustomGame = {
      ...game,
      id: Date.now().toString()
    };
    const updated = [...customGames, newGame];
    setCustomGames(updated);
    localStorage.setItem("bloom_custom_games", JSON.stringify(updated));
  };

  // Persisting wrapper functions
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("bloom_theme_mode", mode);
  };

  const setAppLanguage = (lang: AppLanguage) => {
    setAppLanguageState(lang);
    localStorage.setItem("bloom_language", lang);
  };

  const setCurrentMood = (mood: string) => {
    setCurrentMoodState(mood);
    localStorage.setItem("bloom_mood", mood);
  };

  const addPoints = (points: number) => {
    const nextPoints = userPoints + points;
    setUserPointsState(nextPoints);
    localStorage.setItem("bloom_points", String(nextPoints));
  };

  const addGoal = (title: string, target: number) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      currentProgress: 0,
      targetProgress: target
    };
    const nextGoals = [...goals, newGoal];
    setGoalsState(nextGoals);
    localStorage.setItem("bloom_goals", JSON.stringify(nextGoals));
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
    localStorage.setItem("bloom_goals", JSON.stringify(nextGoals));
  };

  const deleteGoal = (id: string) => {
    const nextGoals = goals.filter(g => g.id !== id);
    setGoalsState(nextGoals);
    localStorage.setItem("bloom_goals", JSON.stringify(nextGoals));
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
    localStorage.setItem("bloom_support_messages", JSON.stringify(nextMsgs));
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
        themeMode,
        appLanguage,
        currentMood,
        userPoints,
        goals,
        activeScreen,
        drawerOpen,
        parentAuthenticated,
        parentAlerts,
        supportMessages,
        userRole,
        currentUser,
        login,
        logout,
        studentGrades,
        updateGrade,
        studentLevels,
        updateStudentLevel,
        familyLinkCodes,
        linkedChildren,
        linkChildAccount,
        moodLogs,
        addMoodLog,
        algerianLevels,
        addCustomTrack,
        addCustomYear,
        customGames,
        addCustomGame,
        setThemeMode,
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
