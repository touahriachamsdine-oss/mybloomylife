"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBloom, AppLanguage, Goal, AlgerianLevel, AlgerianCycle, SUBJECTS_BY_CYCLE, ParentAlert, getKidDailyLimitMs } from "@/context/BloomContext";
import { useTeacherData } from "@/context/teacher";
import { bloomExportAll, bloomImportAll, bloomHydrateFromServer } from "@/lib/storage";
import { formatKidTime } from "@/lib/format";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import AttendanceTracker from "@/components/teacher/AttendanceTracker";
import BehaviorNotesView from "@/components/teacher/BehaviorNotes";
import TeacherSchedule from "@/components/teacher/TeacherSchedule";
import ParentMessagesView from "@/components/teacher/ParentMessages";
import LevelPickerScreen from "@/components/screens/LevelPickerScreen";
import LoginScreen from "@/components/screens/LoginScreen";
import RegisterScreen from "@/components/screens/RegisterScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import AcademicScreen from "@/components/screens/AcademicScreen";
import GamesScreen from "@/components/screens/GamesScreen";
import PsychologicalScreen from "@/components/screens/PsychologicalScreen";
import LearningJournalScreen from "@/components/screens/LearningJournalScreen";
import GratitudeScreen from "@/components/screens/GratitudeScreen";
import GoalsScreen from "@/components/screens/GoalsScreen";
import PlannerScreen from "@/components/screens/PlannerScreen";
import PortfolioScreen from "@/components/screens/PortfolioScreen";
import KidsLockScreen from "@/components/screens/KidsLockScreen";
import ParentScreen from "@/components/screens/ParentScreen";
import AdminDashboardScreen from "@/components/screens/AdminDashboardScreen";
import {
  MathQuizGame,
  MemoryMatchingGame,
  SpeedArithmeticGame,
  WordBuilderGame,
  VocabMatchGame,
  IslamicQuizGame,
  FlashcardsGame,
  TimelineGame,
  PhysicsLabGame,
  SpellingBeeGame,
  CrosswordGame,
  WilayaMatchGame,
} from "@/games";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  TrendingUp,
  Gamepad,
  Heart,
  ListChecks,
  UserRound,
  Plus,
  Trash2,
  Send,
  Check,
  Lock,
  Unlock,
  RefreshCw,
  Pause,
  X,
  Award,
  Clock,
  Sparkles,
  Menu,
  Settings,
  Globe,
  Download,
  Upload,
  Coins,
  Shield,
  Sparkle,
  AlertCircle,
  ArrowLeft,
  Brain,
  Trophy,
  ChevronRight,
  Activity,
  Bell,
  BookOpen,
  Smile,
  Star,
  Zap,
  Users,
  MessageSquare,
  BarChart3
} from "lucide-react";

// Student-experience screens, exposed to the parent role (play-time limited).
const STUDENT_SCREENS = ["home", "academic", "games", "psychological", "learning", "gratitude", "goals", "planner", "portfolio"];

// Screens addressable via the URL (deep links + browser back button).
const SCREEN_ROUTES = ["home", "academic", "games", "psychological", "learning", "gratitude", "goals", "planner", "portfolio", "parent", "admin"];

// Keeps activeScreen in sync with the ?screen= URL param. Navigation through
// setActiveScreen pushes a new URL; the browser back button adopts the URL.
function useScreenRouter() {
  const { activeScreen, setActiveScreen } = useBloom();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlScreen = searchParams.get("screen");
  const skipSyncRef = useRef(false);

  // URL -> state (mount, popstate, programmatic replace)
  useEffect(() => {
    if (urlScreen && SCREEN_ROUTES.includes(urlScreen) && urlScreen !== activeScreen) {
      skipSyncRef.current = true;
      setActiveScreen(urlScreen);
    }
  }, [urlScreen, activeScreen, setActiveScreen]);

  // state -> URL (user navigation)
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    router.replace(`?screen=${activeScreen}`, { scroll: false });
  }, [activeScreen, router]);
}


function App() {
  const {
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
    register,
    registeredUsers,
    logout,
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
    studentLevels,
    updateStudentLevel,
    familyLinkCodes,
    kidRemainingMs,
    t,
    isRtl,
    studyPlan,
    addStudyPlanEntry,
    removeStudyPlanEntry,
    toggleStudyPlanDone,
    priorityTasks,
    addPriorityTask,
    removePriorityTask,
    togglePriorityTask,
  } = useBloom();

  // Mirrors activeScreen into the URL (?screen=...) and back.
  useScreenRouter();

  const [isRegistering, setIsRegistering] = useState(false);

  // Parental play-time limit: the student screens are usable from the parent role
  // for a daily budget (30 min weekdays / 1 hour weekends).
  const onStudentScreen = STUDENT_SCREENS.includes(activeScreen);
  const kidTimeLocked = userRole === "parent" && onStudentScreen && kidRemainingMs <= 0;
  const displayName = currentUser?.name || "Sara";
  // A youth's role badge reflects their chosen subclass (cycle). Both the
  // "moyen" (الطور المتوسط) and "lycee" (الطور الثانوي) pupils share the full
  // youth feature set, so only the label differs.
  const cycle = userRole === "youth" ? (currentUser?.name ? studentLevels[currentUser.name]?.cycle : null) : null;
  const displayRole = userRole
    ? userRole === "youth"
      ? cycle === "lycee"
        ? t("role_subclass_lycee")
        : cycle === "moyen"
          ? t("role_subclass_moyen")
          : cycle === "primaire"
            ? t("role_subclass_primaire")
            : t("role_youth")
      : t("role_" + userRole)
    : "";

  // Intercept: show level picker for students who haven't chosen a level yet
  const studentName = currentUser?.name || "Sara";
  const needsLevelPick = userRole === "youth" && !studentLevels[studentName];

  // School-management sub-view (admin owns the former teacher portal)
  const [teacherView, setTeacherView] = useState("dashboard");
  const [adminView, setAdminView] = useState<"dashboard" | "school">("dashboard");
  const teacherData = useTeacherData();

  // local notification state for parents messages
  const [activeSupportMessage, setActiveSupportMessage] = useState<string | null>(null);

  // Online/offline state so users know when writes are queued vs. synced.
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // track support messages to alert the student
  useEffect(() => {
    if (supportMessages.length > 0) {
      // Show the latest support message as a toast on the child's interface
      setActiveSupportMessage(supportMessages[0].message);
    }
  }, [supportMessages, setActiveSupportMessage]);

  const handleExportData = () => {
    const data = bloomExportAll();
    data.bloom_exported_at = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mybloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const bloomKeys = Object.keys(data).filter(k => k.startsWith("bloom_"));
        if (bloomKeys.length === 0) throw new Error("No bloom_ keys found");
        bloomImportAll(data);
        window.location.reload();
      } catch {
        alert(t("backup_import_invalid"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-0 md:p-6 font-sans" style={{ background: 'linear-gradient(145deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%)' }}>
      {/* Decorative background flowers */}
      <div className="absolute top-10 left-10 text-pink-300 opacity-20 animate-pulse pointer-events-none hidden md:block">
        <Sparkle size={64} />
      </div>
      <div className="absolute bottom-10 right-10 text-purple-300 opacity-20 animate-pulse pointer-events-none hidden md:block">
        <Sparkle size={80} />
      </div>
      <div className="absolute top-1/2 right-1/4 text-teal-300 opacity-10 animate-bounce pointer-events-none hidden md:block">
        <Sparkle size={48} />
      </div>

      {/* Main Responsive Device Shell */}
      <div className="relative w-full h-screen md:h-[850px] md:w-[395px] md:rounded-[44px] md:shadow-2xl overflow-hidden flex flex-col transition-all duration-300" style={{ background: 'linear-gradient(145deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%)' }}>
        


        {userRole === null ? (
          isRegistering ? (
            <RegisterScreen
              t={t}
              register={register}
              appLanguage={appLanguage}
              setAppLanguage={setAppLanguage}
              isRtl={isRtl}
              onNavigateToLogin={() => setIsRegistering(false)}
            />
          ) : (
            <LoginScreen
              t={t}
              login={login}
              appLanguage={appLanguage}
              setAppLanguage={setAppLanguage}
              isRtl={isRtl}
              onNavigateToRegister={() => setIsRegistering(true)}
            />
          )
        ) : needsLevelPick ? (
          <LevelPickerScreen t={t} studentName={studentName} onConfirm={(level) => { updateStudentLevel(studentName, level); }} />
        ) : (
          <>

        {/* Support Notification Toast */}
        <AnimatePresence>
          {activeSupportMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-12 left-4 right-4 bg-primary text-white rounded-2xl p-4 shadow-xl border border-white/20 z-50 flex items-start gap-3"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <Heart className="text-white fill-white shrink-0 animate-bounce" size={20} />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-bold opacity-90">{t("nav_parent")}</p>
                <p className="mt-1 leading-relaxed font-semibold">{activeSupportMessage}</p>
              </div>
              <button
                onClick={() => setActiveSupportMessage(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Bar / Header */}
        <header className="px-4 py-3 flex justify-between items-center bg-transparent z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-2 rounded-xl bg-surface hover:scale-105 active:scale-95 transition-all text-text-primary shadow-sm border border-border-custom"
              aria-label={t("drawer_toggle_label")}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-extrabold text-lg text-text-primary tracking-tight">
              {t(`nav_${activeScreen}`)}
            </h1>
            <span
              title={online ? t("sync_online") : t("sync_offline")}
              className={`ml-1.5 inline-block w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`}
            />
          </div>

          {/* Points display for students / play-time countdown for parents on student screens / Role badge otherwise */}
          {userRole === "youth" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface font-bold text-sm shadow-sm border border-border-custom" style={{ color: 'var(--accent-orange)' }}>
              <Coins size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>{userPoints}</span>
            </div>
          ) : userRole === "parent" && onStudentScreen ? (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border ${
              kidRemainingMs <= 0
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              <Clock size={14} className={kidRemainingMs <= 0 ? "" : "animate-pulse"} />
              <span>{kidRemainingMs <= 0 ? t("kid_mode_no_time") : formatKidTime(kidRemainingMs)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs shadow-sm border border-primary/20">
              <span className="capitalize">{displayRole}</span>
            </div>
          )}
        </header>

        {/* Navigation Drawer Overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="absolute inset-0 z-40">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              />

              {/* Side Drawer Content */}
              <motion.div
                initial={{ x: isRtl ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? "100%" : "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`absolute top-0 bottom-0 ${isRtl ? "right-0" : "left-0"} w-[290px] bg-surface shadow-2xl p-5 flex flex-col justify-between z-50`}
              >
                {/* Header */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-primary font-black text-lg">
                      <Sparkles size={24} className="animate-pulse" />
                      <span>{t("app_name")}</span>
                    </div>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-1.5 rounded-full bg-border-custom text-text-secondary hover:bg-border-custom/80"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* User Profile Info */}
                  <div className="flex flex-col gap-2 p-3.5 mb-6 rounded-2xl bg-border-custom/30 border border-border-custom/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg select-none">
                        {displayName.charAt(0)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-text-primary truncate">
                          {displayName}
                        </span>
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                          {displayRole}
                        </span>
                      </div>
                    </div>
                    {/* Show school level + family code for students */}
                    {userRole === "youth" && (() => {
                      const sName = currentUser?.name || "Sara";
                      const level = studentLevels[sName];
                      const code = familyLinkCodes[sName];
                      return (
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-border-custom/40">
                          {level ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px]">🎓</span>
                              <span className="text-[10px] font-black text-primary">{level.label}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-text-secondary italic">{t("level_not_set")}</span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-text-secondary">{t("family_link_code")}</span>
                            <span className="text-[10px] font-black text-text-primary bg-border-custom/50 px-2 py-0.5 rounded-lg font-mono tracking-wider">{code}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-1">
                    {(() => {
                      let items: { id: string; label: string; icon: React.ReactNode }[] = [];
                      if (userRole === "youth") {
                        items = [
                          { id: "home", label: t("nav_home"), icon: <HomeIcon size={18} /> },
                          { id: "academic", label: t("nav_academic"), icon: <TrendingUp size={18} /> },
                          { id: "games", label: t("nav_games"), icon: <Gamepad size={18} /> },
                          { id: "psychological", label: t("nav_psychological"), icon: <Heart size={18} /> },
                          { id: "learning", label: t("nav_learning"), icon: <BookOpen size={18} /> },
                          { id: "gratitude", label: t("nav_gratitude"), icon: <Sparkles size={18} /> },
                          { id: "goals", label: t("nav_goals"), icon: <ListChecks size={18} /> },
                          { id: "planner", label: t("nav_planner"), icon: <Clock size={18} /> },
                          { id: "portfolio", label: t("nav_portfolio"), icon: <Award size={18} /> }
                        ];
                      } else if (userRole === "parent") {
                        items = [
                          { id: "parent", label: t("nav_parent"), icon: <Shield size={18} /> },
                          { id: "home", label: t("nav_home"), icon: <HomeIcon size={18} /> },
                          { id: "academic", label: t("nav_academic"), icon: <TrendingUp size={18} /> },
                          { id: "games", label: t("nav_games"), icon: <Gamepad size={18} /> },
                          { id: "psychological", label: t("nav_psychological"), icon: <Heart size={18} /> },
                          { id: "learning", label: t("nav_learning"), icon: <BookOpen size={18} /> },
                          { id: "gratitude", label: t("nav_gratitude"), icon: <Sparkles size={18} /> },
                          { id: "goals", label: t("nav_goals"), icon: <ListChecks size={18} /> },
                          { id: "planner", label: t("nav_planner"), icon: <Clock size={18} /> },
                          { id: "portfolio", label: t("nav_portfolio"), icon: <Award size={18} /> }
                        ];
                      } else if (userRole === "psychologist") {
                        items = [
                          { id: "psychological", label: t("nav_psychological"), icon: <Heart size={18} /> }
                        ];
                      } else if (userRole === "admin") {
                        items = ([
                          { id: "admin", label: t("admin_title"), icon: <Shield size={18} />, meta: "dashboard" },
                          { id: "admin", label: t("school_management"), icon: <BarChart3 size={18} />, meta: "school" },
                          { id: "academic", label: t("nav_academic"), icon: <TrendingUp size={18} /> },
                        ] as any);
                      }
                      return items.map((item) => {
                        const meta = (item as any).meta;
                        const isActive =
                          userRole === "admin" && meta
                            ? activeScreen === item.id && ((meta === "school" && adminView === "school") || (meta !== "school" && adminView === "dashboard"))
                            : activeScreen === item.id && (!meta || meta === teacherView);
                        return (
                          <button
                            key={item.id + ((item as any).meta || "")}
                            onClick={() => {
                              setActiveScreen(item.id);
                              if (meta) {
                                if (userRole === "admin") {
                                  setAdminView(meta === "school" ? "school" : "dashboard");
                                  if (meta === "school") setTeacherView("dashboard");
                                } else {
                                  setTeacherView(meta);
                                }
                              }
                              setDrawerOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                              isActive
                                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                : "text-text-primary hover:bg-border-custom/50"
                            }`}
                          >
                            <span className={isActive ? "text-white" : "text-primary"}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      });
                    })()}
                  </nav>
                </div>

                {/* Settings Block */}
                <div className="flex flex-col gap-4 mt-auto border-t border-border-custom pt-4">
                  {/* Language Switcher */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <Globe size={12} />
                      {t("language")}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { code: "en", label: t("lang_english") },
                        { code: "ar", label: t("lang_arabic") },
                        { code: "fr", label: t("lang_french") },
                        { code: "kab", label: t("lang_tamazight") }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setAppLanguage(lang.code as AppLanguage)}
                          className={`text-xs py-2 px-1 rounded-xl font-bold border transition-all ${
                            appLanguage === lang.code
                              ? "bg-primary text-white border-primary"
                              : "border-border-custom hover:bg-border-custom/30 text-text-primary"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>



                  {/* Data Backup / Restore */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <Download size={12} />
                      {t("backup_title")}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleExportData}
                        className="text-xs py-2 px-1 rounded-xl font-bold border transition-all border-border-custom hover:bg-border-custom/30 text-text-primary flex items-center justify-center gap-1"
                      >
                        <Download size={12} /> {t("backup_export")}
                      </button>
                      <label className="text-xs py-2 px-1 rounded-xl font-bold border transition-all border-border-custom hover:bg-border-custom/30 text-text-primary flex items-center justify-center gap-1 cursor-pointer">
                        <Upload size={12} /> {t("backup_import")}
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportData}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Log Out button in the drawer */}
                  <button
                    onClick={() => {
                      logout();
                      setDrawerOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-sm transition-all border border-red-500/20"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/>
                    </svg>
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto px-4 pt-1 relative scroll-smooth ${userRole === "youth" ? "pb-20" : "pb-6"}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {kidTimeLocked ? (
                <KidsLockScreen t={t} onBack={() => setActiveScreen("parent")} />
              ) : (
                <>
              {activeScreen === "home" && <HomeScreen t={t} goals={goals} userPoints={userPoints} incrementGoalProgress={incrementGoalProgress} addPoints={addPoints} setCurrentMood={setCurrentMood} currentMood={currentMood} setActiveScreen={setActiveScreen} />}
              {activeScreen === "admin" && (adminView === "school" ? (() => {
                const subProps = { t, teacher: teacherData, onNavigate: (to: string) => {
                  if (to === "back") setTeacherView("dashboard");
                  else setTeacherView(to);
                }};
                switch (teacherView) {
                  case "attendance": return <AttendanceTracker {...subProps} />;
                  case "behavior": return <BehaviorNotesView {...subProps} />;
                  case "schedule": return <TeacherSchedule {...subProps} />;
                  case "messages": return <ParentMessagesView {...subProps} />;
                  default: return <TeacherDashboard {...subProps} />;
                }
              })() : <AdminDashboardScreen t={t} />)}
              {activeScreen === "academic" && <AcademicScreen t={t} />}
              {activeScreen === "games" && <GamesScreen t={t} addPoints={addPoints} userPoints={userPoints} />}
              {activeScreen === "psychological" && <PsychologicalScreen t={t} currentMood={currentMood} setCurrentMood={setCurrentMood} addPoints={addPoints} />}
              {activeScreen === "learning" && <LearningJournalScreen t={t} addPoints={addPoints} />}
              {activeScreen === "gratitude" && <GratitudeScreen t={t} addPoints={addPoints} />}
              {activeScreen === "goals" && <GoalsScreen t={t} goals={goals} incrementGoalProgress={incrementGoalProgress} deleteGoal={deleteGoal} addGoal={addGoal} addPoints={addPoints} />}
              {activeScreen === "planner" && <PlannerScreen t={t} studyPlan={studyPlan} addStudyPlanEntry={addStudyPlanEntry} removeStudyPlanEntry={removeStudyPlanEntry} toggleStudyPlanDone={toggleStudyPlanDone} priorityTasks={priorityTasks} addPriorityTask={addPriorityTask} removePriorityTask={removePriorityTask} togglePriorityTask={togglePriorityTask} />}
              {activeScreen === "portfolio" && <PortfolioScreen t={t} />}
              {activeScreen === "parent" && (
                <ParentScreen
                  t={t}
                  parentAuthenticated={parentAuthenticated}
                  setParentAuthenticated={setParentAuthenticated}
                  parentAlerts={parentAlerts}
                  sendSupportMessage={sendSupportMessage}
                  kidRemainingMs={kidRemainingMs}
                />
              )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation Bar */}
        {userRole === "youth" && (
          <nav className="absolute bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-border-custom flex justify-around items-center px-2 z-30">
            {[
              { id: "home", icon: <HomeIcon size={20} />, label: t("nav_home") },
              { id: "academic", icon: <TrendingUp size={20} />, label: t("nav_academic") },
              { id: "games", icon: <Gamepad size={20} />, label: t("nav_games") },
              { id: "psychological", icon: <Heart size={20} />, label: t("nav_psychological") },
              { id: "learning", icon: <BookOpen size={20} />, label: t("nav_learning") },
              { id: "gratitude", icon: <Sparkles size={20} />, label: t("nav_gratitude") },
              { id: "goals", icon: <ListChecks size={20} />, label: t("nav_goals") }
            ].map((tab) => {
              const isTabActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreen(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                    isTabActive ? "text-primary scale-105" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold mt-1 max-w-[70px] truncate text-center leading-none">
                    {tab.label}
                  </span>
                  {isTabActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute top-0 w-8 h-1 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}
          </>
        )}

      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in production builds.
export default function RootPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    bloomHydrateFromServer().finally(() => setHydrated(true));
  }, []);
  return hydrated ? (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  ) : null;
}

