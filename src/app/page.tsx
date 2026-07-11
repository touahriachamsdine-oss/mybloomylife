"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useBloom, AppLanguage, Goal, AlgerianLevel, AlgerianCycle, SUBJECTS_BY_CYCLE } from "@/context/BloomContext";
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
  Play,
  Pause,
  X,
  Award,
  Clock,
  Sparkles,
  Menu,
  Settings,
  Globe,
  Coins,
  Shield,
  Sparkle,
  AlertCircle,
  ArrowLeft,
  Brain,
  Trophy,
  ChevronRight,
  Activity,
  Bell
} from "lucide-react";

export default function App() {
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
    t,
    isRtl,
  } = useBloom();

  const [isRegistering, setIsRegistering] = useState(false);

  // Intercept: show level picker for students who haven't chosen a level yet
  const studentName = currentUser?.name || "Sara";
  const needsLevelPick = userRole === "student" && !studentLevels[studentName];

  // local notification state for parents messages
  const [activeSupportMessage, setActiveSupportMessage] = useState<string | null>(null);

  // track support messages to alert the student
  useEffect(() => {
    if (supportMessages.length > 0) {
      // Show the latest support message as a toast on the child's interface
      setActiveSupportMessage(supportMessages[0].message);
    }
  }, [supportMessages]);

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
              aria-label="Toggle Navigation Drawer"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-extrabold text-lg text-text-primary tracking-tight">
              {t(`nav_${activeScreen}`)}
            </h1>
          </div>

          {/* Points display for students / Role badge for others */}
          {userRole === "student" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface font-bold text-sm shadow-sm border border-border-custom" style={{ color: 'var(--accent-orange)' }}>
              <Coins size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>{userPoints}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs shadow-sm border border-primary/20">
              <span className="capitalize">{userRole ? t("role_" + userRole) : ""}</span>
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
                      <span>MyBloom Life</span>
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
                        {currentUser?.name ? currentUser.name.charAt(0) : "S"}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-text-primary truncate">
                          {currentUser?.name || "Sara"}
                        </span>
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                          {userRole ? t("role_" + userRole) : ""}
                        </span>
                      </div>
                    </div>
                    {/* Show school level + family code for students */}
                    {userRole === "student" && (() => {
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
                            <span className="text-[9px] text-text-secondary italic">Level not set</span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-text-secondary">Family Link Code:</span>
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
                      if (userRole === "student") {
                        items = [
                          { id: "home", label: t("nav_home"), icon: <HomeIcon size={18} /> },
                          { id: "academic", label: t("nav_academic"), icon: <TrendingUp size={18} /> },
                          { id: "games", label: t("nav_games"), icon: <Gamepad size={18} /> },
                          { id: "psychological", label: t("nav_psychological"), icon: <Heart size={18} /> },
                          { id: "goals", label: t("nav_goals"), icon: <ListChecks size={18} /> }
                        ];
                      } else if (userRole === "parent") {
                        items = [
                          { id: "parent", label: t("nav_parent"), icon: <Shield size={18} /> }
                        ];
                      } else if (userRole === "teacher") {
                        items = [
                          { id: "academic", label: t("nav_academic"), icon: <TrendingUp size={18} /> }
                        ];
                      } else if (userRole === "psychologist") {
                        items = [
                          { id: "psychological", label: t("nav_psychological"), icon: <Heart size={18} /> }
                        ];
                      } else if (userRole === "admin") {
                        items = [
                          { id: "admin", label: t("nav_admin"), icon: <Shield size={18} /> }
                        ];
                      }
                      return items.map((item) => {
                        const isActive = activeScreen === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveScreen(item.id);
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
        <main className={`flex-1 overflow-y-auto px-4 pt-1 relative scroll-smooth ${userRole === "student" ? "pb-20" : "pb-6"}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {activeScreen === "home" && <HomeScreen t={t} goals={goals} userPoints={userPoints} incrementGoalProgress={incrementGoalProgress} addPoints={addPoints} setCurrentMood={setCurrentMood} currentMood={currentMood} setActiveScreen={setActiveScreen} />}
              {activeScreen === "admin" && <AdminDashboardScreen t={t} />}
              {activeScreen === "academic" && <AcademicScreen t={t} />}
              {activeScreen === "games" && <GamesScreen t={t} addPoints={addPoints} userPoints={userPoints} />}
              {activeScreen === "psychological" && <PsychologicalScreen t={t} currentMood={currentMood} setCurrentMood={setCurrentMood} addPoints={addPoints} />}
              {activeScreen === "goals" && <GoalsScreen t={t} goals={goals} incrementGoalProgress={incrementGoalProgress} deleteGoal={deleteGoal} addGoal={addGoal} addPoints={addPoints} />}
              {activeScreen === "parent" && (
                <ParentScreen
                  t={t}
                  parentAuthenticated={parentAuthenticated}
                  setParentAuthenticated={setParentAuthenticated}
                  parentAlerts={parentAlerts}
                  sendSupportMessage={sendSupportMessage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation Bar */}
        {userRole === "student" && (
          <nav className="absolute bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-border-custom flex justify-around items-center px-2 z-30">
            {[
              { id: "home", icon: <HomeIcon size={20} />, label: t("nav_home") },
              { id: "academic", icon: <TrendingUp size={20} />, label: t("nav_academic") },
              { id: "games", icon: <Gamepad size={20} />, label: t("nav_games") },
              { id: "psychological", icon: <Heart size={20} />, label: t("nav_psychological") },
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

/* ==========================================================================
   COMPONENT: Level Picker Screen (Algerian School System)
   ========================================================================== */
const ALGERIAN_LEVELS: { cycle: AlgerianCycle; label: string; years: { year: number; label: string; tracks?: string[] }[] }[] = [
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

function LevelPickerScreen({
  t,
  studentName,
  onConfirm
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  studentName: string;
  onConfirm: (level: AlgerianLevel) => void;
}) {
  const { algerianLevels } = useBloom();
  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | null>(null);
  const [selectedYearIdx, setSelectedYearIdx] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>("");

  const activeCycle = selectedCycleIdx !== null ? algerianLevels[selectedCycleIdx] : null;
  const activeYear = activeCycle && selectedYearIdx !== null ? activeCycle.years[selectedYearIdx] : null;
  const needsTrack = !!(activeYear?.tracks && activeYear.tracks.length > 0);
  const canConfirm = activeCycle && activeYear && (!needsTrack || selectedTrack);

  const handleConfirm = () => {
    if (!activeCycle || !activeYear) return;
    const level: AlgerianLevel = {
      cycle: activeCycle.cycle,
      year: activeYear.year,
      track: selectedTrack || undefined,
      label: needsTrack && selectedTrack
        ? `${activeYear.label} — ${selectedTrack}`
        : activeYear.label
    };
    onConfirm(level);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🎓</div>
        <h1 className="text-lg font-black text-text-primary">Choisissez votre niveau</h1>
        <p className="text-xs text-text-secondary mt-1">اختر مستواك الدراسي حسب المنظومة التربوية الجزائرية</p>
        <p className="text-[10px] text-primary font-bold mt-0.5">Welcome, {studentName}!</p>
      </div>

      {/* Cycle selector */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider px-1">الطور — Cycle scolaire</span>
        <div className="flex flex-col gap-2">
          {algerianLevels.map((cycle, idx) => (
            <button
              key={cycle.cycle}
              onClick={() => { setSelectedCycleIdx(idx); setSelectedYearIdx(null); setSelectedTrack(""); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedCycleIdx === idx
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
              }`}
            >
              <span className="text-sm font-black">{cycle.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Year selector */}
      {activeCycle && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider px-1">السنة — Année</span>
          <div className="grid grid-cols-2 gap-2">
            {activeCycle.years.map((yr, yIdx) => (
              <button
                key={yr.year}
                onClick={() => { setSelectedYearIdx(yIdx); setSelectedTrack(""); }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  selectedYearIdx === yIdx
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
                }`}
              >
                <span className="text-xs font-black">{yr.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Track selector (Lycée 2nd/3rd year) */}
      {activeYear?.tracks && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider px-1">الشعبة — Filière / Spécialisation</span>
          <div className="flex flex-col gap-2">
            {activeYear.tracks.map((track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedTrack === track
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
                }`}
              >
                <span className="text-xs font-black">{track}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="w-full py-3.5 bg-primary text-white font-black text-sm rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        ✓ Confirmer mon niveau
      </button>
    </div>
  );
}

/* ==========================================================================
   COMPONENT: Login Screen
   ========================================================================== */
function LoginScreen({
  t,
  login,
  appLanguage,
  setAppLanguage,
  isRtl,
  onNavigateToRegister
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  login: (u: string, p: string) => boolean;
  appLanguage: string;
  setAppLanguage: (lang: any) => void;
  isRtl: boolean;
  onNavigateToRegister: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const success = login(username, password);
    if (!success) {
      setError(true);
    }
  };

  const handleAutofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(false);
  };

  const autofillRoles = [
    { key: "role_student", username: "student", password: "123", icon: "🎓" },
    { key: "role_parent", username: "parent", password: "1234", icon: "👨‍👩‍👧‍👦" },
    { key: "role_teacher", username: "teacher", password: "123", icon: "🏫" },
    { key: "role_psychologist", username: "psychologist", password: "123", icon: "🧠" }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-6 relative z-20 overflow-y-auto scrollbar-none">
      {/* Language Bar at the top of the login portal */}
      <div className="flex justify-end items-center gap-1.5 mb-2">
        <Globe size={14} className="text-text-secondary animate-pulse" />
        <select
          value={appLanguage}
          onChange={(e) => setAppLanguage(e.target.value as any)}
          className="text-xs font-bold bg-surface border border-border-custom text-text-primary rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="kab">Tamazight</option>
        </select>
      </div>

      {/* Main Login Card */}
      <div className="my-auto flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20 animate-pulse">
            <Brain size={36} className="text-primary fill-primary/10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              {t("login_title")}
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              {t("home_subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2.5 text-xs font-bold"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{t("login_error")}</span>
            </motion.div>
          )}

          {/* Username Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_username")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t("login_username")}
                className={`w-full py-3.5 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_password")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full py-3.5 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 mt-2 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/30 transition-all"
          >
            {t("login_btn")}
          </button>
        </form>

        {/* Autofill Helper Block */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border-custom" />
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
              {t("login_autofill_title")}
            </span>
            <div className="h-px flex-1 bg-border-custom" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {autofillRoles.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => handleAutofill(role.username, role.password)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface hover:bg-border-custom/50 border border-border-custom transition-all text-left text-xs font-bold text-text-primary"
                style={{ direction: isRtl ? "rtl" : "ltr" }}
              >
                <span className="text-base">{role.icon}</span>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{t(role.key)}</span>
                  <span className="text-[9px] text-text-secondary/80 font-mono mt-0.5 truncate">
                    {role.username} / {role.password}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-xs text-primary font-black hover:underline text-center mt-2 focus:outline-none"
        >
          {t("register_no_account")}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENT: Register Screen
   ========================================================================== */
function RegisterScreen({
  t,
  register,
  appLanguage,
  setAppLanguage,
  isRtl,
  onNavigateToLogin
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  register: (u: string, n: string, p: string, r: any) => { success: boolean; error?: string };
  appLanguage: string;
  setAppLanguage: (lang: any) => void;
  isRtl: boolean;
  onNavigateToLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "parent" | "teacher" | "psychologist">("student");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const res = register(username, name, password, role);
    if (!res.success) {
      setError(res.error || "An error occurred");
    } else {
      setSuccess(true);
      setName("");
      setUsername("");
      setPassword("");
      // Wait a moment and navigate to login
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 relative z-20 overflow-y-auto scrollbar-none">
      {/* Language Bar */}
      <div className="flex justify-end items-center gap-1.5 mb-2">
        <Globe size={14} className="text-text-secondary animate-pulse" />
        <select
          value={appLanguage}
          onChange={(e) => setAppLanguage(e.target.value as any)}
          className="text-xs font-bold bg-surface border border-border-custom text-text-primary rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="kab">Tamazight</option>
        </select>
      </div>

      {/* Main Register Card */}
      <div className="my-auto flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20 animate-pulse">
            <Brain size={36} className="text-primary fill-primary/10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              {t("register_title")}
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              {t("home_subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2.5 text-xs font-bold"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{t(error)}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2.5 text-xs font-bold"
            >
              <Check size={16} className="shrink-0" />
              <span>{t("register_success")}</span>
            </motion.div>
          )}

          {/* Full Name Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("register_name")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t("register_name")}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Username Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_username")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t("login_username")}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_password")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("register_role")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary outline-none transition-all appearance-none`}
              >
                <option value="student">{t("role_student")}</option>
                <option value="parent">{t("role_parent")}</option>
                <option value="teacher">{t("role_teacher")}</option>
                <option value="psychologist">{t("role_psychologist")}</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/30 transition-all"
          >
            {t("register_btn")}
          </button>
        </form>

        <button
          onClick={onNavigateToLogin}
          className="text-xs text-primary font-black hover:underline text-center mt-2 focus:outline-none"
        >
          {t("register_have_account")}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCREEN: Home Screen
   ========================================================================== */
function HomeScreen({
  t,
  goals,
  userPoints,
  incrementGoalProgress,
  addPoints,
  setCurrentMood,
  currentMood,
  setActiveScreen
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  goals: Goal[];
  userPoints: number;
  incrementGoalProgress: (id: string) => void;
  addPoints: (pts: number) => void;
  setCurrentMood: (m: string) => void;
  currentMood: string;
  setActiveScreen: (s: string) => void;
}) {
  const { currentUser, studentGrades, userRole } = useBloom();
  const [moodTip, setMoodTip] = useState<string | null>(null);
  const [celebrateGoalId, setCelebrateGoalId] = useState<string | null>(null);
  
  // Get active student name
  const studentName = userRole === "student" ? (currentUser?.name || "Sara") : "Sara";
  const grades = studentGrades[studentName] || {};
  
  // Calculate GPA dynamically out of 20
  const subjectKeys = Object.keys(grades);
  const totalSubjects = subjectKeys.length;
  const gradesSum = subjectKeys.reduce((acc, k) => acc + grades[k], 0);
  const currentGPA = totalSubjects > 0 ? parseFloat((gradesSum / totalSubjects).toFixed(2)) : 16.8;

  // School calendar days Sunday to Thursday (index 0 to 4 in JS is Sun to Thu)
  const currentDayOfWeek = new Date().getDay();
  // Map JS day to Algerian school day index (0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday)
  // If Friday or Saturday, default to Sunday (0)
  const initialDayIndex = (currentDayOfWeek >= 0 && currentDayOfWeek <= 4) ? currentDayOfWeek : 0;
  const [selectedDay, setSelectedDay] = useState<number>(initialDayIndex);

  // Prayer times state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Mock prayer times (Algiers typical times)
  const prayerTimes = [
    { name: "prayer_fadjr", time: "04:12", h: 4, m: 12 },
    { name: "prayer_dhuhr", time: "12:45", h: 12, m: 45 },
    { name: "prayer_asr", time: "16:30", h: 16, m: 30 },
    { name: "prayer_maghrib", time: "20:05", h: 20, m: 5 },
    { name: "prayer_isha", time: "21:40", h: 21, m: 40 }
  ];

  // Find index of next prayer
  let nextPrayerIdx = 0;
  for (let i = 0; i < prayerTimes.length; i++) {
    const p = prayerTimes[i];
    if (currentHour < p.h || (currentHour === p.h && currentMinute < p.m)) {
      nextPrayerIdx = i;
      break;
    }
    if (i === prayerTimes.length - 1) {
      nextPrayerIdx = 0; // next is Fadjr tomorrow
    }
  }

  // School Week schedules (Sunday - Thursday)
  const schoolSchedule: Record<string, Record<number, { time: string; subject: string }[]>> = {
    Sara: {
      0: [
        { time: "08:00 - 09:30", subject: "subject_math" },
        { time: "09:45 - 11:15", subject: "subject_physics" },
        { time: "11:30 - 13:00", subject: "subject_arabic" }
      ],
      1: [
        { time: "08:00 - 09:30", subject: "subject_french" },
        { time: "09:45 - 11:15", subject: "subject_english" },
        { time: "11:30 - 13:00", subject: "subject_science" }
      ],
      2: [
        { time: "08:00 - 09:30", subject: "subject_math" },
        { time: "09:45 - 11:15", subject: "subject_science" },
        { time: "11:30 - 13:00", subject: "subject_history_geo" }
      ],
      3: [
        { time: "08:00 - 09:30", subject: "subject_philosophy" },
        { time: "09:45 - 11:15", subject: "subject_physics" },
        { time: "11:30 - 13:00", subject: "subject_islamic" }
      ],
      4: [
        { time: "08:00 - 09:30", subject: "subject_english" },
        { time: "09:45 - 11:15", subject: "subject_arabic" },
        { time: "11:30 - 13:00", subject: "goal_sport" }
      ]
    },
    Ahmed: {
      0: [
        { time: "08:00 - 09:30", subject: "subject_arabic" },
        { time: "09:45 - 11:15", subject: "subject_math" },
        { time: "11:30 - 13:00", subject: "subject_islamic" }
      ],
      1: [
        { time: "08:00 - 09:30", subject: "subject_tamazight" },
        { time: "09:45 - 11:15", subject: "subject_french" },
        { time: "11:30 - 13:00", subject: "subject_civic" }
      ],
      2: [
        { time: "08:00 - 09:30", subject: "subject_math" },
        { time: "09:45 - 11:15", subject: "subject_physics" },
        { time: "11:30 - 13:00", subject: "subject_history_geo" }
      ],
      3: [
        { time: "08:00 - 09:30", subject: "subject_science" },
        { time: "09:45 - 11:15", subject: "subject_english" },
        { time: "11:30 - 13:00", subject: "goal_sport" }
      ],
      4: [
        { time: "08:00 - 09:30", subject: "subject_arabic" },
        { time: "09:45 - 11:15", subject: "subject_tamazight" },
        { time: "11:30 - 13:00", subject: "subject_math" }
      ]
    }
  };

  const activeSchedule = schoolSchedule[studentName] || schoolSchedule["Sara"];

  const moodEmojis: Record<string, string> = {
    mood_happy: "😊",
    mood_sad: "😢",
    mood_anxious: "😰",
    mood_angry: "😡",
    mood_calm: "😌"
  };

  const handleMoodSelect = (moodKey: string) => {
    setCurrentMood(moodKey);
    setMoodTip(t(`mood_desc_${moodKey.replace("mood_", "")}`));
  };

  const handleQuickGoalCheck = (goal: Goal) => {
    if (goal.currentProgress < goal.targetProgress) {
      incrementGoalProgress(goal.id);
      
      // If the goal will be completed (currentProgress + 1 = target)
      if (goal.currentProgress + 1 === goal.targetProgress) {
        setCelebrateGoalId(goal.id);
        setTimeout(() => setCelebrateGoalId(null), 3000);
      }
    }
  };



  const schoolDaysList = [
    { key: "sunday", label: "sunday", num: 0 },
    { key: "monday", label: "monday", num: 1 },
    { key: "tuesday", label: "tuesday", num: 2 },
    { key: "wednesday", label: "wednesday", num: 3 },
    { key: "thursday", label: "thursday", num: 4 }
  ];

  return (
    <>
      {/* Welcome Card */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="z-10 flex flex-col gap-1">
            <h2 className="text-xl font-black text-text-primary">
              {t("home_greeting", currentUser?.name || "Sara")}
            </h2>
            <p className="text-xs text-text-secondary font-semibold">
              {t("home_subtitle")}
            </p>
          </div>
          <div className="bg-primary/10 text-primary p-2.5 rounded-2xl animate-pulse">
            <Sparkles size={24} className="fill-current" />
          </div>
        </div>
      </div>

      {/* Mood Tracker Panel */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div>
          <h3 className="font-black text-sm text-text-primary">{t("home_mood_title")}</h3>
          <p className="text-[11px] text-text-secondary">{t("home_mood_subtitle")}</p>
        </div>

        {/* Emoji Selector */}
        <div className="flex justify-between gap-1.5 py-1">
          {Object.keys(moodEmojis).map((moodKey) => {
            const isSelected = currentMood === moodKey;
            return (
              <button
                key={moodKey}
                onClick={() => handleMoodSelect(moodKey)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                  isSelected
                    ? "bg-primary scale-110 shadow-md ring-4 ring-primary/10"
                    : "bg-border-custom/40 hover:bg-border-custom/70 active:scale-95"
                }`}
              >
                {moodEmojis[moodKey]}
              </button>
            );
          })}
        </div>

        {/* Mood Tip Bubble */}
        <AnimatePresence mode="wait">
          {(moodTip || currentMood) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border border-primary/10 rounded-2xl p-3 text-xs leading-relaxed text-text-primary"
            >
              <p className="font-bold text-primary mb-1 flex items-center gap-1.5">
                <Heart size={12} className="fill-current" />
                {t(currentMood)}
              </p>
              <p>{moodTip || t(`mood_desc_${currentMood.replace("mood_", "")}`)}</p>
              {(currentMood === "mood_anxious" || currentMood === "mood_sad") && (
                <button
                  onClick={() => setActiveScreen("psychological")}
                  className="mt-2 text-primary font-black hover:underline flex items-center gap-1"
                >
                  🧘 Start Breathing Exercise
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GPA Stats Card — matches mobile HomeScreen layout */}
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setActiveScreen("academic")}
            className="p-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all"
          >
            <TrendingUp size={16} />
          </button>
          <span className="text-sm font-black text-text-primary">{t("gpa_overall")}</span>
        </div>

        {/* Big GPA Number */}
        <div className="flex items-end justify-end gap-1.5">
          <span className="text-xs font-bold text-green-500 mb-1">{t("gpa_status_excellent")}</span>
          <span className="text-sm text-text-secondary mb-1">/20</span>
          <span className="text-4xl font-black text-text-primary leading-none">{currentGPA}</span>
        </div>

        {/* Sparkline Graph */}
        {(() => {
          const sparkData = [10, 12, 11, 14, 15, currentGPA];
          const svgW = 300;
          const svgH = 70;
          const sparkCoords = sparkData.map((v, i) => ({
            x: (i / (sparkData.length - 1)) * svgW,
            y: svgH - (v / 20) * svgH,
          }));
          const sparkPath = sparkCoords
            .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
            .join(" ");
          return (
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-14" preserveAspectRatio="none">
              <path
                d={sparkPath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparkCoords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={i === sparkCoords.length - 1 ? 5 : 3}
                  fill={i === sparkCoords.length - 1 ? "#4CAF50" : "var(--primary)"}
                />
              ))}
            </svg>
          );
        })()}
      </div>

      {/* Points + Mood 2-column row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points Card */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(249, 213, 110, 0.2)" }}>
            <span className="text-xl">⭐</span>
          </div>
          <span className="text-[11px] font-bold text-text-secondary text-center">{t("my_points")}</span>
          <span className="text-xl font-black text-text-primary">{userPoints}</span>
        </div>

        {/* Mood Card */}
        <button
          onClick={() => setActiveScreen("psychological")}
          className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col items-center gap-2 hover:bg-border-custom/30 active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-xl">
            {moodEmojis[currentMood] || "😌"}
          </div>
          <span className="text-[11px] font-bold text-text-secondary">{t("home_mood_title")}</span>
          <span className="text-xs font-black text-green-500">{t(currentMood)}</span>
        </button>
      </div>

      {/* Weekly Progress Ring Card */}
      {(() => {
        const completedGoals = goals.filter((g) => g.currentProgress >= g.targetProgress).length;
        const weeklyPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 75;
        const r = 32;
        const circ = +(2 * Math.PI * r).toFixed(2);
        const dashOffset = +(circ - (circ * weeklyPct) / 100).toFixed(2);
        return (
          <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-xs">
            <div className="flex items-center gap-4">
              {/* Circular Progress Ring */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r={r} className="stroke-border-custom fill-none" strokeWidth="7" />
                  <circle
                    cx="40"
                    cy="40"
                    r={r}
                    className="stroke-primary fill-none transition-all duration-1000"
                    strokeWidth="7"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-text-primary">{weeklyPct}%</span>
              </div>
              {/* Text */}
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm font-black text-text-primary">{t("weekly_progress")}</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">
                  {t("weekly_progress_motivation")}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Daily Challenge Widget */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(249, 213, 110, 0.2)" }}
          >
            <Trophy size={18} className="text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-text-primary">{t("home_challenge_title")}</span>
            <span className="text-[9px] text-text-secondary">{t("home_challenge_subtitle")}</span>
          </div>
        </div>
        <button
          onClick={() => setActiveScreen("games")}
          className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-xl hover:bg-primary/10 active:scale-95 transition-all"
        >
          {t("home_play_now")} <ChevronRight size={10} />
        </button>
      </div>

      {/* Algerian School Week Schedule & Prayer Times widgets */}
      <div className="flex flex-col gap-3">
        {/* School Week Calendar Card */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs font-black text-text-primary">{t("school_calendar_title")}</span>
              <span className="text-[9px] text-text-secondary">Sunday - Thursday Agenda</span>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 py-1 px-2.5 rounded-full">
              {t(`parent_child_${studentName.toLowerCase()}`)}
            </span>
          </div>

          {/* School day pills */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {schoolDaysList.map((day) => {
              const isToday = currentDayOfWeek === day.num;
              const isSelected = selectedDay === day.num;
              return (
                <button
                  key={day.num}
                  onClick={() => setSelectedDay(day.num)}
                  className={`py-2 rounded-xl text-[10px] font-black transition-all flex flex-col items-center border ${
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : isToday
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-border-custom/25 border-border-custom/40 text-text-primary hover:bg-border-custom/40"
                  }`}
                >
                  <span className="opacity-90">{t(day.label).substring(0, 3)}</span>
                  {isToday && <span className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Day's classes details */}
          <div className="flex flex-col gap-2 pt-1">
            {(activeSchedule[selectedDay] || []).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-border-custom/10 border border-border-custom/50 hover:bg-border-custom/20 transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black text-text-primary">{t(item.subject)}</span>
                  <span className="text-[9px] text-text-secondary font-bold flex items-center gap-1">
                    <Clock size={8} /> {item.time}
                  </span>
                </div>
                <span className="text-[10px] text-primary font-black bg-primary/5 py-1 px-2 rounded-lg">
                  Algeria Syllabus
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prayer Times Widget */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-xs text-text-secondary uppercase tracking-wider">{t("prayer_times")}</h3>
              <p className="text-[9px] text-text-secondary mt-0.5">Wilaya: Algiers / الجزائر</p>
            </div>
            <span className="text-[10px] font-black text-primary bg-primary/10 py-1 px-2 rounded-lg">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Grid of prayer times */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {prayerTimes.map((p, idx) => {
              const isNext = nextPrayerIdx === idx;
              return (
                <div
                  key={p.name}
                  className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    isNext
                      ? "bg-primary text-white border-primary shadow-sm scale-105 ring-2 ring-primary/20"
                      : "bg-border-custom/15 border-border-custom/40 text-text-primary"
                  }`}
                >
                  <span className="text-[9px] font-black truncate max-w-full leading-none">
                    {t(p.name)}
                  </span>
                  <span className="text-[10px] font-extrabold whitespace-nowrap">
                    {p.time}
                  </span>
                  {isNext && (
                    <span className="text-[8px] bg-white text-primary font-black py-0.5 px-1.5 rounded-full mt-0.5 uppercase tracking-wide leading-none animate-pulse">
                      Next
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Goals Checklist */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm text-text-primary">{t("home_goals_title")}</h3>
            <p className="text-[11px] text-text-secondary">{t("home_goals_subtitle")}</p>
          </div>
          <button
            onClick={() => setActiveScreen("goals")}
            className="text-xs text-primary font-black hover:underline"
          >
            {t("home_manage_goals")}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {goals.length === 0 ? (
            <div className="text-center py-4 text-xs text-text-secondary">
              No active goals. Add some in the Goals tab!
            </div>
          ) : (
            goals.slice(0, 3).map((goal) => {
              const isCompleted = goal.currentProgress >= goal.targetProgress;
              const isCelebrating = celebrateGoalId === goal.id;
              return (
                <div
                  key={goal.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-border-custom/10 border-border-custom/50 text-text-primary"
                  } ${isCelebrating ? "ring-2 ring-green-500 animate-bounce" : ""}`}
                >
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-bold truncate">
                      {t(goal.title)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${(goal.currentProgress / goal.targetProgress) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black shrink-0">
                        {goal.currentProgress}/{goal.targetProgress}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickGoalCheck(goal)}
                    disabled={isCompleted}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-primary/10 hover:bg-primary/20 text-primary active:scale-95"
                    }`}
                  >
                    {isCompleted ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Academic Screen
   ========================================================================== */
function AcademicScreen({ t }: { t: (k: string, ...a: (string | number)[]) => string }) {
  const { studentGrades, updateGrade, userRole, currentUser, registeredUsers } = useBloom();
  const students = registeredUsers.filter(u => u.role === "student").map(u => u.name);
  const [teacherSelectedStudent, setTeacherSelectedStudent] = useState<string>("Sara");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Identify who we are inspecting
  const currentStudent = userRole === "teacher" ? (teacherSelectedStudent || students[0] || "Sara") : (userRole === "student" ? (currentUser?.name || "Sara") : "Sara");
  const grades = studentGrades[currentStudent] || {};

  // Calculate dynamic average GPA out of 20
  const subjectKeys = Object.keys(grades);
  const totalSubjects = subjectKeys.length;
  const gradesSum = subjectKeys.reduce((acc, k) => acc + grades[k], 0);
  const currentGPA = totalSubjects > 0 ? parseFloat((gradesSum / totalSubjects).toFixed(2)) : 16.8;

  // Algerian subjects styling colors
  const subjectColors: Record<string, string> = {
    subject_math: "bg-emerald-500",
    subject_physics: "bg-blue-500",
    subject_science: "bg-teal-500",
    subject_arabic: "bg-amber-500",
    subject_tamazight: "bg-indigo-500",
    subject_french: "bg-purple-500",
    subject_english: "bg-pink-500",
    subject_islamic: "bg-green-600",
    subject_history_geo: "bg-rose-500",
    subject_civic: "bg-cyan-500",
    subject_philosophy: "bg-violet-500"
  };

  // 3-Trimester progress values
  const trimesters = currentStudent === "Ahmed" ? [
    { num: 1, gpa: 13.50 },
    { num: 2, gpa: 14.20 },
    { num: 3, gpa: currentGPA }
  ] : [
    { num: 1, gpa: 15.20 },
    { num: 2, gpa: 15.80 },
    { num: 3, gpa: currentGPA }
  ];

  // SVG dimensions
  const width = 300;
  const height = 100;
  const padding = 20;

  // Convert GPA coordinates for SVG (GPA ranges from 10 to 20 for scaling)
  const points = trimesters.map((termVal, index) => {
    const x = padding + (index / (trimesters.length - 1)) * (width - padding * 2);
    const y = height - padding - ((termVal.gpa - 10) / (20 - 10)) * (height - padding * 2);
    return { x, y, ...termVal };
  });

  // Build SVG Path string
  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // If teacher, render Grade Book Dashboard
  if (userRole === "teacher") {
    return (
      <>
        {/* Teacher Selection Card */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div>
            <h2 className="text-xs font-black text-primary uppercase tracking-wider">Teacher Grade Book</h2>
            <p className="text-[10px] text-text-secondary">Select student & modify grades in real-time</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {students.map((sName) => (
              <button
                key={sName}
                onClick={() => setTeacherSelectedStudent(sName)}
                className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition-all ${
                  teacherSelectedStudent === sName
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
                }`}
              >
                {t(`parent_child_${sName.toLowerCase()}`).startsWith("parent_child_") ? sName : t(`parent_child_${sName.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Grades Editor */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-border-custom pb-2">
            <span className="text-xs font-black text-text-primary">Subject Grades (out of 20)</span>
            <span className="text-xs font-black text-primary font-bold">Class Average: {currentGPA}</span>
          </div>

          <div className="flex flex-col gap-3 pt-1 max-h-[400px] overflow-y-auto pr-1">
            {Object.entries(grades).map(([subKey, gradeVal]) => (
              <div key={subKey} className="flex flex-col gap-1.5 p-2 rounded-2xl bg-border-custom/10 border border-border-custom/30">
                <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                  <span>{t(subKey)}</span>
                  <span className="text-primary font-black">{gradeVal.toFixed(1)} / 20</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={gradeVal}
                    onChange={(e) => updateGrade(currentStudent, subKey, parseFloat(e.target.value))}
                    className="flex-1 accent-primary h-1.5 bg-border-custom/50 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={gradeVal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 20) {
                        updateGrade(currentStudent, subKey, val);
                      }
                    }}
                    className="w-14 text-center text-xs font-black py-1 border border-border-custom rounded-lg bg-surface text-text-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Semester GPA Ring Widget */}
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col items-center justify-center text-center gap-4">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("aca_gpa_title")}</span>
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="56" cy="56" r="48" className="stroke-border-custom fill-none" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              className="stroke-primary fill-none transition-all duration-1000"
              strokeWidth="8"
              strokeDasharray="301"
              strokeDashoffset={301 - (301 * (currentGPA / 20) * 100) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-text-primary">{currentGPA}</span>
            <span className="text-[10px] font-black text-text-secondary">/ 20</span>
          </div>
        </div>
        <div className="bg-primary/5 px-4 py-2.5 rounded-2xl border border-primary/10">
          <p className="text-xs font-semibold text-text-primary leading-relaxed">
            {t("aca_gpa_message")}
          </p>
        </div>
      </div>

      {/* Interactive Line Graph */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">Trimester History Trend</h3>
        <p className="text-[10px] text-text-secondary">Hover nodes to inspect overall performance</p>

        <div className="relative flex justify-center py-2">
          <svg width={width} height={height} className="overflow-visible">
            {/* Draw grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-border-custom/30" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="text-border-custom/30" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border-custom/30" />

            {/* Sparkline path */}
            <path
              d={pathD}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Nodes */}
            {points.map((p, index) => (
              <g key={p.num}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === index ? "7" : "5"}
                  className="fill-white stroke-primary cursor-pointer transition-all"
                  strokeWidth="3"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(index)}
                />
                {hoveredPoint === index && (
                  <g>
                    {/* Tooltip Rect */}
                    <rect
                      x={p.x - 30}
                      y={p.y - 32}
                      width="60"
                      height="20"
                      rx="6"
                      className="fill-zinc-800 dark:fill-zinc-200"
                    />
                    <text
                      x={p.x}
                      y={p.y - 18}
                      textAnchor="middle"
                      className="text-[10px] fill-white dark:fill-zinc-950 font-black"
                    >
                      Moy. {p.gpa}
                    </text>
                  </g>
                )}
                {/* Labels */}
                <text
                  x={p.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="text-[9px] fill-current text-text-secondary font-bold"
                >
                  Trim {p.num}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Grade Subject cards */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">{t("aca_grades_title")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(grades).map(([subKey, gradeVal]) => {
            const pct = Math.round((gradeVal / 20) * 100);
            const color = subjectColors[subKey] || "bg-primary";
            return (
              <div key={subKey} className="p-3 rounded-2xl bg-border-custom/20 border border-border-custom/50 flex flex-col gap-2">
                <span className="text-[11px] font-black text-text-primary">{t(subKey)}</span>
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-text-secondary">{gradeVal.toFixed(1)}/20</span>
                  <span className="text-primary">{pct}%</span>
                </div>
                <div className="w-full bg-border-custom/40 rounded-full h-1.5 overflow-hidden">
                  <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academic Calendar Events */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">{t("aca_calendar_title")}</h3>
        <div className="flex flex-col gap-2">
          {[
            { title: t("event_math_exam"), date: "Dec 12, 2026", type: "exam" },
            { title: t("event_science_project"), date: "Dec 18, 2026", type: "project" },
            { title: t("event_term_holiday"), date: "Dec 24, 2026", type: "holiday" }
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-border-custom/20 transition-all">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  item.type === "exam" ? "bg-red-500" : item.type === "project" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <span className="text-xs font-bold text-text-primary leading-snug">{item.title}</span>
              </div>
              <span className="text-[9px] font-black text-text-secondary whitespace-nowrap">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Games Screen
   ========================================================================== */
function GamesScreen({
  t,
  addPoints,
  userPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  addPoints: (pts: number) => void;
  userPoints: number;
}) {
  const { currentUser, userRole, studentLevels, appLanguage, customGames } = useBloom();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const studentName = (userRole === "student" && currentUser?.name) ? currentUser.name : "Sara";
  const studentLevel = studentLevels[studentName];
  const cycle = studentLevel?.cycle || "moyen";

  // Find if active game is a custom game
  const activeCustomGame = customGames?.find(g => g.id === activeGame);

  if (activeGame === "math" || (activeCustomGame && activeCustomGame.type === "quiz")) {
    return (
      <MathQuizGame
        t={t}
        onExit={() => setActiveGame(null)}
        addPoints={addPoints}
        cycle={cycle}
        appLanguage={appLanguage}
        customQuestions={activeCustomGame?.questions}
        customTitle={activeCustomGame?.title}
      />
    );
  }

  if (activeGame === "memory" || (activeCustomGame && activeCustomGame.type === "memory")) {
    return (
      <MemoryMatchingGame
        t={t}
        onExit={() => setActiveGame(null)}
        addPoints={addPoints}
        cycle={cycle}
        customEmojis={activeCustomGame?.emojis}
        customTitle={activeCustomGame?.title}
      />
    );
  }

  // Custom games matching student's cycle
  const levelCustomGames = customGames?.filter(g => g.cycle === cycle) || [];

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
        <h3 className="font-black text-sm text-text-primary">{t("games_choose_type")}</h3>
        <p className="text-[11px] text-text-secondary">Boost your grades & cognitive skills with learning challenges tailored for {studentLevel?.label || "your level"}</p>
      </div>

      {/* Games Selection List */}
      <div className="flex flex-col gap-3">
        {/* Game 1: Memory Game */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-sm relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 p-8 text-indigo-200 dark:text-indigo-950/20 translate-x-4 -translate-y-4 select-none">
            <Brain size={120} />
          </div>
          <div className="z-10 flex flex-col gap-1 max-w-[70%]">
            <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full w-max">
              {t("game_brain_title")}
            </span>
            <h4 className="font-black text-base text-text-primary mt-1">{t("mem_title")}</h4>
            <p className="text-xs text-text-secondary leading-snug">
              {cycle === "primaire" && "Fun emoji matching to boost focus and memory."}
              {cycle === "moyen" && "Match math and school symbols to train your cognitive focus."}
              {cycle === "lycee" && "Advanced science, technology and career symbols challenge."}
            </p>
          </div>
          <button
            onClick={() => setActiveGame("memory")}
            className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-white py-3 rounded-2xl text-xs font-black shadow-xs transition-all mt-2 z-10"
          >
            {t("game_start_play")}
          </button>
        </div>

        {/* Game 2: Math Quiz */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-sm relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 p-8 text-amber-200 dark:text-amber-950/20 translate-x-4 -translate-y-4 select-none">
            <Trophy size={120} />
          </div>
          <div className="z-10 flex flex-col gap-1 max-w-[70%]">
            <span className="text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full w-max" style={{ background: 'var(--accent-yellow)', opacity: 0.6, color: 'var(--text-primary)' }}>
              {t("game_challenges_title")}
            </span>
            <h4 className="font-black text-base text-text-primary mt-1">{t("game_math_challenge")}</h4>
            <p className="text-xs text-text-secondary leading-snug">
              {cycle === "primaire" && "Test your skills with fun arithmetic and daily word puzzles."}
              {cycle === "moyen" && "Intermediate algebraic equations and geometry problems."}
              {cycle === "lycee" && "High-level calculus, trigonometry and advanced logic puzzles."}
            </p>
          </div>
          <button
            onClick={() => setActiveGame("math")}
            className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-white py-3 rounded-2xl text-xs font-black shadow-xs transition-all mt-2 z-10"
          >
            {t("game_start_play")}
          </button>
        </div>

        {/* Custom Games (admin-created) */}
        {levelCustomGames.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-px bg-border-custom/50" />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Pedagogical Games</span>
              <div className="flex-1 h-px bg-border-custom/50" />
            </div>
            {levelCustomGames.map(game => (
              <div key={game.id} className="p-4 rounded-3xl bg-surface border-2 border-primary/20 shadow-sm relative overflow-hidden flex flex-col gap-4">
                <div className="absolute top-2 right-3 z-20">
                  <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border border-primary/20">
                    Admin Created
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-8 text-primary/10 translate-x-4 -translate-y-4 select-none">
                  {game.type === "memory" ? <Brain size={100} /> : <Trophy size={100} />}
                </div>
                <div className="z-10 flex flex-col gap-1 max-w-[75%]">
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full w-max">
                    {game.type === "memory" ? "Memory Game" : "Quiz Challenge"}
                  </span>
                  <h4 className="font-black text-base text-text-primary mt-1">{game.title}</h4>
                  <p className="text-xs text-text-secondary leading-snug">{game.description}</p>
                </div>
                <button
                  onClick={() => setActiveGame(game.id)}
                  className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-white py-3 rounded-2xl text-xs font-black shadow-xs transition-all mt-2 z-10"
                >
                  {t("game_start_play")}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

/* ==========================================================================
   GAME: Math Quiz
   ========================================================================== */
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

function MathQuizGame({
  t,
  onExit,
  addPoints,
  cycle,
  appLanguage,
  customQuestions,
  customTitle
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
  appLanguage: string;
  customQuestions?: QuizQuestion[];
  customTitle?: string;
}) {
  const getQuestionsForLevel = (): QuizQuestion[] => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions;
    }
    if (cycle === "primaire") {
      if (appLanguage === "ar") {
        return [
          { question: "ما هي نتيجة: 8 + 6؟", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "إذا كان لدى سارة 15 حبة تمر وأكلت 4، فكم حبة بقيت لديها؟", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "ما هو حاصل ضرب: 9 × 3؟", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Combien font : 8 + 6 ?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "Si Sara a 15 dattes et en mange 4, combien lui en reste-t-il ?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "Combien font : 9 × 3 ?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Acḥal i d-yettak: 8 + 6?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "Ma yella ɣur Sara 15 n ttejratin tččer 4, acḥal i s-d-yeqqimen?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "Acḥal i d-yettak: 9 × 3?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "What is 8 + 6?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "If Sara has 15 dates and eats 4, how many dates does she have left?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "What is 9 × 3?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      }
    } else if (cycle === "lycee") {
      if (appLanguage === "ar") {
        return [
          { question: "أوجد مشتق الدالة f(x) = x² + 3x عند x = 2:", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "ما هي قيمة log2(32)؟", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "أوجد حلول المعادلة: x² - 5x + 6 = 0:", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Trouvez la dérivée de f(x) = x² + 3x pour x = 2 :", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "Quelle est la valeur de log2(32) ?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Résoudre l'équation : x² - 5x + 6 = 0 :", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Af-d derivé n f(x) = x² + 3x deg x = 2 :", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "Acḥal i d azal n log2(32)?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Fru taseddart: x² - 5x + 6 = 0 :", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "Find the derivative of f(x) = x² + 3x at x = 2:", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "What is the value of log2(32)?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Solve the equation: x² - 5x + 6 = 0:", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      }
    } else {
      if (appLanguage === "ar") {
        return [
          { question: "حل المعادلة:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "ما هو مجموع قياسات زوايا المثلث؟", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "ما هي نتيجة: 3/4 + 1/2؟", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Résoudre l'équation :\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "Quelle est la somme des angles d'un triangle ?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "Quelle est la valeur de : 3/4 + 1/2 ?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Fru taseddart:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "Acḥal i d timrirt n tɣemrin n lmutellaṯ?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "Acḥal i d-yettak: 3/4 + 1/2?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "Solve the equation:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "What is the sum of the interior angles of a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "What is the value of: 3/4 + 1/2?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      }
    }
  };

  const quizQuestions = getQuestionsForLevel();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  const activeQuestion = quizQuestions[currentIdx];

  // Question Timer Loop
  useEffect(() => {
    if (isFinished || selectedIdx !== null) return;

    if (timeLeft <= 0) {
      handleOptionSelect(-1); // Count as timeout (wrong)
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, currentIdx, selectedIdx, isFinished]);

  const handleOptionSelect = (index: number) => {
    setSelectedIdx(index);
    if (index === activeQuestion.correctIndex) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setTimeLeft(15);
    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      // Award 50 points per correct answer
      addPoints(correctAnswers * 50);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setCorrectAnswers(0);
    setIsFinished(false);
    setTimeLeft(15);
  };

  if (isFinished) {
    const totalPointsEarned = correctAnswers * 50;
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: 'var(--accent-yellow)' }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("quiz_congrats")}</h4>
          <p className="text-xs text-text-secondary mt-1">{t("quiz_finished_desc")}</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-text-primary">
            <span>{t("quiz_correct_count", correctAnswers, quizQuestions.length)}</span>
            <span>{Math.round((correctAnswers / quizQuestions.length) * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs font-black" style={{ color: 'var(--accent-orange)' }}>
            <span>Points Earned</span>
            <span>+{totalPointsEarned} Pts</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl text-xs font-black transition-all"
          >
            {t("mem_finish_game")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
          <ArrowLeft size={16} />
          {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary uppercase tracking-wide">
          {customTitle || t("game_math_challenge")}
        </span>
        <span className="text-xs font-black text-primary">
          {t("quiz_progress", currentIdx + 1, quizQuestions.length)}
        </span>
      </div>

      {/* Timer Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock size={10} /> Timer
          </span>
          <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-4 rounded-2xl bg-border-custom/20 border border-border-custom/30 text-center py-6">
        <p className="text-sm font-black text-text-primary whitespace-pre-line leading-relaxed">
          {activeQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {activeQuestion.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === activeQuestion.correctIndex;
          const showAnswer = selectedIdx !== null;

          let btnClass = "border-border-custom bg-surface text-text-primary hover:bg-border-custom/20";
          if (showAnswer) {
            if (isCorrect) {
              btnClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-black";
            } else if (isSelected) {
              btnClass = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 font-black";
            } else {
              btnClass = "border-border-custom opacity-50 bg-surface text-text-secondary";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={showAnswer}
              className={`w-full py-3.5 px-4 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${btnClass}`}
            >
              <span>{opt}</span>
              {showAnswer && isCorrect && <Check size={14} className="text-green-500" />}
              {showAnswer && isSelected && !isCorrect && <X size={14} className="text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Navigation action */}
      {selectedIdx !== null && (
        <button
          onClick={handleNext}
          className="w-full bg-primary text-white py-3.5 rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all mt-2"
        >
          {currentIdx + 1 === quizQuestions.length ? t("quiz_view_result") : t("quiz_next_question")}
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   GAME: Memory Match Game
   ========================================================================== */
interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function MemoryMatchingGame({
  t,
  onExit,
  addPoints,
  cycle,
  customEmojis,
  customTitle
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
  customEmojis?: string[];
  customTitle?: string;
}) {
  const getGameConfig = () => {
    if (customEmojis && customEmojis.length > 0) {
      const len = customEmojis.length;
      let gridCols = "grid-cols-4";
      if (len <= 6) gridCols = "grid-cols-3";
      else if (len <= 8) gridCols = "grid-cols-4";
      else gridCols = "grid-cols-5";
      return {
        emojis: customEmojis,
        gridCols,
        timeLeft: 45,
        pointsPerWin: len * 20
      };
    }
    switch (cycle) {
      case "primaire":
        return {
          emojis: ["🐶", "🐱", "🦊", "🐻", "🦁", "🐯"],
          gridCols: "grid-cols-3",
          timeLeft: 50,
          pointsPerWin: 120
        };
      case "lycee":
        return {
          emojis: ["🧬", "🚀", "💻", "📊", "⚖️", "🏛️", "🌍", "🛰️", "⚙️", "🧪"],
          gridCols: "grid-cols-5",
          timeLeft: 40,
          pointsPerWin: 200
        };
      case "moyen":
      default:
        return {
          emojis: ["📐", "🧪", "🔬", "💻", "📚", "🎨", "⚽", "🧠"],
          gridCols: "grid-cols-4",
          timeLeft: 45,
          pointsPerWin: 150
        };
    }
  };

  const config = getGameConfig();

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLeft);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);

  // Initialize deck
  const initGame = () => {
    const deck = [...config.emojis, ...config.emojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelectedCards([]);
    setMoves(0);
    setTimeLeft(config.timeLeft);
    setGameOver(null);
  };

  useEffect(() => {
    initGame();
  }, [cycle]);

  // Timer loop
  useEffect(() => {
    if (gameOver) return;

    if (timeLeft <= 0) {
      setGameOver("lose");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  // Ref to hold points to award
  const pendingPoints = useRef<number | null>(null);

  // Safely call addPoints outside of the render/setState cycle
  useEffect(() => {
    if (pendingPoints.current !== null) {
      addPoints(pendingPoints.current);
      pendingPoints.current = null;
    }
  }, [gameOver]);

  // Card select handling
  const handleCardClick = (id: number) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    // Flip card
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    const nextSelected = [...selectedCards, id];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = nextSelected;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            const next = prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            );
            // Check win condition purely on data
            const allMatched = next.every((c) => c.isMatched);
            if (allMatched) {
              pendingPoints.current = config.pointsPerWin + timeLeft;
              setGameOver("win");
            }
            return next;
          });
          setSelectedCards([]);
        }, 600);
      } else {
        // Mismatch - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  if (gameOver) {
    const isWin = gameOver === "win";
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        {isWin ? (
          <Trophy style={{ color: 'var(--accent-yellow)' }} className="fill-current animate-bounce" size={60} />
        ) : (
          <AlertCircle className="text-red-500 animate-pulse" size={60} />
        )}
        <div>
          <h4 className="font-black text-xl text-text-primary">
            {isWin ? t("mem_victory") : t("mem_timeout")}
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            {isWin ? t("mem_victory_desc") : t("mem_timeout_desc")}
          </p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>Moves Made</span>
            <span>{moves}</span>
          </div>
          {isWin && (
            <div className="flex justify-between font-black" style={{ color: 'var(--accent-orange)' }}>
              <span>Points Awarded</span>
              <span>+{config.pointsPerWin + timeLeft} Pts</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={initGame}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl text-xs font-black transition-all"
          >
            {t("mem_finish_game")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-2 border-b border-border-custom">
        <div className="flex justify-between items-center">
          <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
            <ArrowLeft size={16} />
            {t("mem_back")}
          </button>
          <span className="text-xs font-black text-text-primary uppercase tracking-wide">
            {customTitle || t("mem_title")}
          </span>
          <span className={`text-xs font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-primary"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="text-[10px] text-text-secondary text-center">Moves: {moves}</div>
      </div>

      {/* Card Grid */}
      <div className={`grid ${config.gridCols} gap-3 my-2 justify-center`}>
        {cards.map((card) => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="w-full aspect-square relative perspective-1000 cursor-pointer"
            >
              <div
                className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Back side of Card (Hidden) */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 border border-primary/20 flex items-center justify-center backface-hidden shadow-xs">
                  <Sparkles className="text-white/40" size={24} />
                </div>
                {/* Front side of Card (Revealed Emoji) */}
                <div className="absolute inset-0 rounded-2xl bg-border-custom/30 dark:bg-zinc-800 border-2 border-primary/30 flex items-center justify-center text-3xl backface-hidden rotate-y-180 shadow-xs">
                  {card.emoji}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   SCREEN: Psychological Support Screen
   ========================================================================== */
function PsychologicalScreen({
  t,
  currentMood,
  setCurrentMood,
  addPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  currentMood: string;
  setCurrentMood: (m: string) => void;
  addPoints: (pts: number) => void;
}) {
  const { userRole, currentUser, moodLogs, registeredUsers } = useBloom();
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"in" | "hold" | "out">("in");
  const [breathingTimer, setBreathingTimer] = useState<number>(60);
  const [showBreathingComplete, setShowBreathingComplete] = useState<boolean>(false);

  const students = registeredUsers
    .filter((u) => u.role === "student")
    .map((u) => u.name);

  // Counselor guidance notes state stored locally
  const [guidanceNotes, setGuidanceNotes] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bloom_guidance_notes");
      return saved ? JSON.parse(saved) : {
        Sara: ["Prioritize sleep before the physics exam.", "Your daily math habits are showing great results!"],
        Ahmed: ["Make sure to review Tamazight vocabulary regularly.", "Take a 5-minute breather when feeling anxious."]
      };
    }
    return { Sara: [], Ahmed: [] };
  });

  const [newAdvice, setNewAdvice] = useState("");
  const [adviceStudent, setAdviceStudent] = useState<string>("Sara");

  // Keep adviceStudent updated if students list changes
  useEffect(() => {
    if (students.length > 0 && !students.includes(adviceStudent)) {
      setAdviceStudent(students[0]);
    }
  }, [students, adviceStudent]);

  const saveAdvice = (student: string, notesList: string[]) => {
    const updated = { ...guidanceNotes, [student]: notesList };
    setGuidanceNotes(updated);
    localStorage.setItem("bloom_guidance_notes", JSON.stringify(updated));
  };

  const handleAddAdvice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvice.trim()) return;
    const currentNotes = guidanceNotes[adviceStudent] || [];
    const updatedNotes = [newAdvice.trim(), ...currentNotes];
    saveAdvice(adviceStudent, updatedNotes);
    setNewAdvice("");
  };

  const handleDeleteAdvice = (student: string, indexToDelete: number) => {
    const currentNotes = guidanceNotes[student] || [];
    const updatedNotes = currentNotes.filter((_, idx) => idx !== indexToDelete);
    saveAdvice(student, updatedNotes);
  };

  const moodEmojis: Record<string, string> = {
    mood_happy: "😊",
    mood_sad: "😢",
    mood_anxious: "😰",
    mood_angry: "😡",
    mood_calm: "😌"
  };

  // Breathing Exercise Loop
  useEffect(() => {
    if (!breathingActive) return;

    if (breathingTimer <= 0) {
      setBreathingActive(false);
      setShowBreathingComplete(true);
      addPoints(50); // Award points for completing exercise
      return;
    }

    const timer = setTimeout(() => {
      setBreathingTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [breathingTimer, breathingActive]);

  // Breathing Cycles: 4s Breathe In, 2s Hold, 4s Breathe Out
  useEffect(() => {
    if (!breathingActive) return;

    let cycleTime = 0;
    const interval = setInterval(() => {
      cycleTime = (cycleTime + 1) % 10;
      if (cycleTime < 4) {
        setBreathingPhase("in");
      } else if (cycleTime < 6) {
        setBreathingPhase("hold");
      } else {
        setBreathingPhase("out");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive]);

  const handleStartBreathing = () => {
    setBreathingActive(true);
    setBreathingTimer(60);
    setBreathingPhase("in");
    setShowBreathingComplete(false);
  };

  const handleStopBreathing = () => {
    setBreathingActive(false);
  };

  const activeStudentName = (userRole === "student" && currentUser?.name) ? currentUser.name : "Sara";
  const activeStudentAdvice = guidanceNotes[activeStudentName] || [];

  // === PSYCHOLOGIST PORTAL ===
  if (userRole === "psychologist") {
    return (
      <>
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1">
          <h2 className="text-base font-black text-text-primary">Pedagogical Guidance Portal</h2>
          <p className="text-[11px] text-text-secondary">Monitor student wellbeing & post academic coping recommendations</p>
        </div>

        {/* Student Mood Logs */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">Recent Student Mood Logs</h3>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
            {moodLogs.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">No mood logs registered today.</p>
            ) : moodLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-2.5 rounded-2xl bg-border-custom/10 border border-border-custom/40">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{moodEmojis[log.mood] || "😊"}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-text-primary">{log.student}</span>
                    <span className="text-[9px] text-text-secondary font-bold">{t(log.mood)}</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-text-secondary">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Post Guidance Advice */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">Post Guidance Recommendation</h3>
          <form onSubmit={handleAddAdvice} className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {students.map((sName) => (
                <button type="button" key={sName} onClick={() => setAdviceStudent(sName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${adviceStudent === sName ? "bg-primary text-white border-primary" : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"}`}>
                  {t(`parent_child_${sName.toLowerCase()}`).startsWith("parent_child_") ? sName : t(`parent_child_${sName.toLowerCase()}`)}
                </button>
              ))}
            </div>
            <textarea value={newAdvice} onChange={(e) => setNewAdvice(e.target.value)}
              placeholder={`Write academic guidance or coping tips for ${adviceStudent}...`}
              rows={2} required
              className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold" />
            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-black shadow-xs hover:opacity-90 transition-all">
              Post Advice
            </button>
          </form>
        </div>

        {/* Advice History by Student */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">Advice History</h3>
          <div className="flex flex-col gap-3">
            {students.map((studentName) => {
              const notes = guidanceNotes[studentName] || [];
              return (
                <div key={studentName} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    {t(`parent_child_${studentName.toLowerCase()}`).startsWith("parent_child_") ? studentName : t(`parent_child_${studentName.toLowerCase()}`)} ({notes.length})
                  </span>
                  {notes.length === 0 ? (
                    <p className="text-[10px] text-text-secondary italic pl-2">No advice logged yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-primary/20">
                      {notes.map((note, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-3 p-1.5 rounded-lg hover:bg-border-custom/10">
                          <p className="text-xs text-text-primary leading-relaxed flex-1 font-semibold">• {note}</p>
                          <button onClick={() => handleDeleteAdvice(studentName, idx)} className="text-red-400 hover:text-red-600 shrink-0 text-[10px] font-bold">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1">
        <h2 className="text-base font-black text-text-primary">{t("psy_title")}</h2>
        <p className="text-[11px] text-text-secondary">{t("psy_instruction")}</p>
      </div>

      {/* Counselor Advice Card for Students */}
      {activeStudentAdvice.length > 0 && (
        <div className="p-4 rounded-3xl bg-surface border border-primary/20 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
            <span>🧠</span>
            <span>Guidance from your Counselor</span>
          </div>
          <div className="flex flex-col gap-2">
            {activeStudentAdvice.slice(0, 2).map((note, index) => (
              <div key={index} className="p-2.5 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-text-primary leading-relaxed font-semibold">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Mood Board */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <span className="text-xs font-bold text-text-primary">{t("psy_question")}</span>
        <div className="grid grid-cols-5 gap-2 py-1 justify-center">
          {Object.keys(moodEmojis).map((moodKey) => {
            const isSelected = currentMood === moodKey;
            return (
              <button
                key={moodKey}
                onClick={() => setCurrentMood(moodKey)}
                className={`aspect-square rounded-full flex flex-col items-center justify-center text-xl transition-all ${
                  isSelected
                    ? "bg-primary scale-110 shadow-md ring-4 ring-primary/10 text-white"
                    : "bg-border-custom/30 text-text-primary hover:bg-border-custom/50"
                }`}
              >
                <span>{moodEmojis[moodKey]}</span>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-text-secondary bg-border-custom/10 p-3 rounded-2xl border border-border-custom/50 leading-relaxed font-semibold">
          {t(`mood_desc_${currentMood.replace("mood_", "")}`)}
        </div>
      </div>

      {/* Suggested Breathing Exercise Panel */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">{t("psy_exercises")}</h3>

        {showBreathingComplete ? (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center flex flex-col items-center gap-3 py-6">
            <Award className="text-green-500 animate-bounce" size={40} />
            <div>
              <p className="text-sm font-black text-green-700 dark:text-green-400">Exercise Completed!</p>
              <p className="text-[10px] text-text-secondary mt-1">Mental wellness score boosted: +50 points</p>
            </div>
            <button
              onClick={() => setShowBreathingComplete(false)}
              className="px-5 py-2 bg-green-500 text-white font-bold text-xs rounded-xl hover:bg-green-600 transition-all"
            >
              Okay
            </button>
          </div>
        ) : breathingActive ? (
          /* Animated breathing session screen */
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-border-custom/50 flex flex-col items-center gap-6 py-8">
            <div className="flex items-center justify-between w-full text-xs font-black text-text-secondary">
              <span>Time Left: {breathingTimer}s</span>
              <button onClick={handleStopBreathing} className="text-red-500 flex items-center gap-0.5">
                <X size={14} /> Stop
              </button>
            </div>

            {/* Pulsing Breathing Sphere */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div
                className={`absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/20 border border-primary/20 blur-sm transition-all duration-[4000ms] ease-in-out ${
                  breathingPhase === "in"
                    ? "scale-125 opacity-100 shadow-[0_0_30px_var(--primary)]"
                    : breathingPhase === "hold"
                    ? "scale-125 opacity-80"
                    : "scale-90 opacity-40"
                }`}
              />
              <div
                className={`w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-md transition-all duration-[4000ms] ease-in-out ${
                  breathingPhase === "in" ? "scale-125" : breathingPhase === "hold" ? "scale-125" : "scale-90"
                }`}
              >
                {breathingPhase === "in" && "Inhale"}
                {breathingPhase === "hold" && "Hold"}
                {breathingPhase === "out" && "Exhale"}
              </div>
            </div>

            <p className="text-xs font-semibold text-text-secondary text-center px-4 leading-relaxed">
              {breathingPhase === "in" && "Slowly fill your lungs with fresh energy... 🌬️"}
              {breathingPhase === "hold" && "Pause and retain this calmness... 🧘"}
              {breathingPhase === "out" && "Release all tension and stress... 💨"}
            </p>
          </div>
        ) : (
          /* Default static exercise selection */
          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-2xl bg-border-custom/10 border border-border-custom/50 flex justify-between items-center gap-3">
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-xs font-black text-text-primary">{t("psy_ex_breathing")}</span>
                <span className="text-[10px] text-text-secondary">{t("psy_ex_breathing_desc")}</span>
                <span className="text-[9px] text-primary font-black mt-1">{t("psy_ex_breathing_duration")}</span>
              </div>
              <button
                onClick={handleStartBreathing}
                className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
              >
                {t("psy_start")}
              </button>
            </div>

            {/* Static tips widgets offline */}
            {[
              { title: t("psy_ex_writing"), desc: t("psy_ex_writing_desc"), dur: t("psy_ex_writing_duration") },
              { title: t("psy_ex_walking"), desc: t("psy_ex_walking_desc"), dur: t("psy_ex_walking_duration") }
            ].map((ex, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-border-custom/10 border border-border-custom/50 flex justify-between items-center gap-3 opacity-80">
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-xs font-black text-text-primary">{ex.title}</span>
                  <span className="text-[10px] text-text-secondary">{ex.desc}</span>
                  <span className="text-[9px] text-text-secondary font-bold mt-1">{ex.dur}</span>
                </div>
                <span className="text-xs text-text-secondary font-black italic">Offline Activity</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip of the Day card */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
        <h3 className="font-black text-xs text-text-secondary flex items-center gap-1.5 uppercase tracking-wider">
          <Activity size={12} className="text-primary" />
          {t("psy_tip_title")}
        </h3>
        <p className="text-xs text-text-primary leading-relaxed font-semibold">
          {t("psy_tip_text")}
        </p>
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Goals Screen
   ========================================================================== */
function GoalsScreen({
  t,
  goals,
  incrementGoalProgress,
  deleteGoal,
  addGoal,
  addPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  goals: Goal[];
  incrementGoalProgress: (id: string) => void;
  deleteGoal: (id: string) => void;
  addGoal: (title: string, target: number) => void;
  addPoints: (pts: number) => void;
}) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newTarget, setNewTarget] = useState<number>(5);

  const goalSuggestions = [
    { title: "goal_math", label: "Mathematics Review" },
    { title: "goal_reading", label: "20 Min Reading" },
    { title: "goal_exercises", label: "Do Exercises" },
    { title: "goal_water", label: "Drink Water" },
    { title: "goal_sport", label: "Exercise" }
  ];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addGoal(newTitle, newTarget);
    setNewTitle("");
    setNewTarget(5);
    setShowAddForm(false);
  };

  const handleIncrement = (goal: Goal) => {
    if (goal.currentProgress < goal.targetProgress) {
      incrementGoalProgress(goal.id);
    }
  };

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-sm font-black text-text-primary">{t("goals_weekly_title")}</h2>
          <p className="text-[11px] text-text-secondary">Progress points: 100 bonus on completion</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-primary text-white py-2 px-3.5 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-xs"
        >
          <Plus size={14} /> Add Goal
        </button>
      </div>

      {/* Goal Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-4 text-text-primary"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">{t("goals_add_new")}</span>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full hover:bg-border-custom/50">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="flex flex-col gap-3">
                {/* Title selection suggestions */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("goals_title_label")}</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter customized goal"
                    className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                  {/* Suggestions bubbles */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {goalSuggestions.map((sug) => (
                      <button
                        type="button"
                        key={sug.title}
                        onClick={() => setNewTitle(sug.title)}
                        className={`text-[9px] font-bold py-1 px-2.5 rounded-full border transition-all ${
                          newTitle === sug.title
                            ? "bg-primary text-white border-primary"
                            : "border-border-custom hover:bg-border-custom/50 text-text-secondary"
                        }`}
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target count */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("goals_target_label")}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseInt(e.target.value, 10))}
                    className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-border-custom hover:bg-border-custom/80 py-3.5 rounded-xl text-xs font-bold transition-all text-text-primary"
                  >
                    {t("goals_cancel_btn")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/95 py-3.5 rounded-xl text-xs font-black text-white transition-all shadow-xs"
                  >
                    {t("goals_add_btn")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal list container */}
      <div className="flex flex-col gap-2.5">
        {goals.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-3xl border border-border-custom/50 p-6">
            <ListChecks className="text-border-custom mx-auto mb-3" size={48} />
            <p className="text-xs font-bold text-text-secondary whitespace-pre-line leading-relaxed">
              {t("goals_empty")}
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const isCompleted = goal.currentProgress >= goal.targetProgress;
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-3xl bg-surface border transition-all flex flex-col gap-3 shadow-xs ${
                  isCompleted ? "border-green-500/30 text-green-800 dark:text-green-300" : "border-border-custom"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-black text-xs truncate text-text-primary">
                      {t(goal.title)}
                    </span>
                    {isCompleted ? (
                      <span className="text-[9px] bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400 py-0.5 px-2 rounded-full font-black w-max">
                        {t("goals_completed_badge")} 🎉
                      </span>
                    ) : (
                      <span className="text-[9px] text-text-secondary font-semibold">Active Goal</span>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 hover:scale-105 active:scale-95 transition-all"
                      aria-label="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={() => handleIncrement(goal)}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> {t("goals_add_btn")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-border-custom/50 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-green-500" : "bg-primary"
                      }`}
                      style={{ width: `${(goal.currentProgress / goal.targetProgress) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-text-primary shrink-0">
                    {goal.currentProgress} / {goal.targetProgress}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Parents Portal
   ========================================================================== */
interface ParentAlert {
  id: string;
  type: "math" | "goal_completed" | "challenge" | "fatigue";
  childName: string;
  timeValue: number;
  isDays: boolean;
}

function ParentScreen({
  t,
  parentAuthenticated,
  setParentAuthenticated,
  parentAlerts,
  sendSupportMessage
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  parentAuthenticated: boolean;
  setParentAuthenticated: (auth: boolean) => void;
  parentAlerts: ParentAlert[];
  sendSupportMessage: (to: string, msg: string) => void;
}) {
  const { studentGrades, linkChildAccount, linkedChildren, familyLinkCodes, studentLevels } = useBloom();
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [selectedChild, setSelectedChild] = useState<string>(() => {
    return linkedChildren[0] || "Sara";
  });
  const [supportText, setSupportText] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [linkCode, setLinkCode] = useState<string>("");
  const [linkResult, setLinkResult] = useState<{ success: boolean; message: string } | null>(null);

  // Synchronize selectedChild with linkedChildren updates
  useEffect(() => {
    if (linkedChildren.length > 0 && !linkedChildren.includes(selectedChild)) {
      setSelectedChild(linkedChildren[0]);
    }
  }, [linkedChildren, selectedChild]);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = linkChildAccount(linkCode);
    if (result.success) {
      setLinkResult({ success: true, message: `✓ ${result.childName} linked successfully!` });
      setLinkCode("");
    } else {
      setLinkResult({ success: false, message: "Code not found. Check the student's profile for their code." });
    }
    setTimeout(() => setLinkResult(null), 4000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      setParentAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const handleNumClick = (val: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + val);
      setPinError(false);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportText.trim()) return;

    sendSupportMessage(selectedChild, supportText);
    setSupportText("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Compute live GPA from context grades
  // Compute live GPA from context grades
  const computeGPA = (student: string) => {
    const grades = studentGrades[student] || {};
    const keys = Object.keys(grades);
    if (keys.length === 0) return 0;
    const sum = keys.reduce((acc, k) => acc + grades[k], 0);
    return parseFloat((sum / keys.length).toFixed(2));
  };

  const gpa = computeGPA(selectedChild);
  const progress = Math.round((gpa / 20) * 100);
  const activeStudentLevel = studentLevels[selectedChild];
  
  // Custom or mock levels/points/history based on child name
  const points = selectedChild === "Ahmed" ? 1450 : 2350;
  const history = selectedChild === "Ahmed" ? [13.5, 14.2, gpa] : (selectedChild === "Sara" ? [15.2, 15.8, gpa] : [gpa, gpa, gpa]);
  const notes = selectedChild === "Ahmed" 
    ? [t("parent_note_ahmed_1"), t("parent_note_ahmed_2")] 
    : (selectedChild === "Sara" ? [t("parent_note_sara_1"), t("parent_note_sara_2")] : [t("Check out the custom guidance notes posted by the psychologist for coping recommendations.")]);

  const activeChildInfo = {
    gpa,
    progress,
    level: activeStudentLevel?.year || 12,
    points,
    history,
    notes
  };

  // Lockscreen keypad component
  if (!parentAuthenticated) {
    return (
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-6 text-center py-8">
        <div className="bg-primary/10 text-primary p-3 rounded-2xl">
          <Lock size={32} />
        </div>
        <div>
          <h2 className="font-black text-base text-text-primary">{t("parent_pin_title")}</h2>
          <p className="text-[11px] text-text-secondary mt-1 max-w-[80%] mx-auto">
            {t("parent_pin_subtitle")}
          </p>
        </div>

        {/* PIN Dot display */}
        <div className="flex gap-4 my-2">
          {[0, 1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > dot
                  ? "bg-primary border-primary scale-110"
                  : "border-border-custom bg-border-custom/30"
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
            <AlertCircle size={10} /> {t("parent_pin_error")}
          </p>
        )}

        {/* Custom Numeric Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumClick(num)}
              className="w-14 h-14 rounded-full bg-border-custom/20 hover:bg-border-custom/50 active:scale-95 text-text-primary text-lg font-bold flex items-center justify-center transition-all mx-auto shadow-xs border border-border-custom/20"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="text-[10px] font-black text-text-secondary hover:underline self-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleNumClick("0")}
            className="w-14 h-14 rounded-full bg-border-custom/20 hover:bg-border-custom/50 active:scale-95 text-text-primary text-lg font-bold flex items-center justify-center transition-all mx-auto shadow-xs border border-border-custom/20"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-[10px] font-black text-red-500 hover:underline self-center"
          >
            Delete
          </button>
        </div>

        <button
          onClick={handlePinSubmit}
          disabled={pin.length !== 4}
          className="w-full bg-primary disabled:opacity-40 text-white py-3.5 rounded-2xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all mt-2"
        >
          {t("parent_login_btn")}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Lock Button */}
      <div className="flex justify-between items-center p-3 rounded-2xl bg-surface border border-border-custom shadow-xs">
        <div>
          <h2 className="text-xs font-black text-text-primary">{t("parent_title")}</h2>
          <p className="text-[9px] text-text-secondary">Parental Dashboard</p>
        </div>
        <button
          onClick={() => setParentAuthenticated(false)}
          className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:underline p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20"
        >
          <Unlock size={12} /> Lock Portal
        </button>
      </div>

      {/* Link Child Account Card */}
      <div className="p-4 rounded-3xl bg-surface border border-primary/20 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔗</span>
          <div>
            <h3 className="text-xs font-black text-text-primary">Link Child Account</h3>
            <p className="text-[9px] text-text-secondary">Enter the family code from your child's profile to connect</p>
          </div>
        </div>

        {/* Already linked children */}
        {linkedChildren.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">✓ Linked Children</span>
            {linkedChildren.map((childName) => {
              const level = studentLevels[childName as "Sara" | "Ahmed"];
              const code = familyLinkCodes[childName] || "—";
              return (
                <div key={childName} className="flex justify-between items-center p-2.5 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{childName.charAt(0)}</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-text-primary">{childName}</span>
                      {level ? (
                        <span className="text-[9px] text-primary font-bold">{level.label}</span>
                      ) : (
                        <span className="text-[9px] text-text-secondary italic">Level not set</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-text-secondary bg-border-custom/40 px-2 py-1 rounded-lg font-mono">{code}</span>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleLinkSubmit} className="flex gap-2">
          <input
            type="text"
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
            placeholder="e.g. BLM-7X4"
            maxLength={7}
            className="flex-1 px-3 py-2 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-primary/20 outline-none tracking-widest uppercase"
            required
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white font-black text-xs rounded-xl hover:opacity-90 transition-all shrink-0">
            Link
          </button>
        </form>

        {linkResult && (
          <p className={`text-[10px] font-bold px-1 ${linkResult.success ? "text-emerald-600" : "text-red-500"}`}>
            {linkResult.message}
          </p>
        )}
      </div>

      {/* Child Switcher Tabs */}
      {linkedChildren.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {linkedChildren.map((cName) => {
            const isActive = selectedChild === cName;
            return (
              <button
                key={cName}
                onClick={() => setSelectedChild(cName)}
                className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
                }`}
              >
                {t(`parent_child_${cName.toLowerCase()}`).startsWith("parent_child_") ? cName : t(`parent_child_${cName.toLowerCase()}`)}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Child Reports Summary Card */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-4">
        {/* Child level metadata */}
        <div className="flex justify-between items-center border-b border-border-custom pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black">
              {selectedChild[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-text-primary">
                {t(`parent_child_${selectedChild.toLowerCase()}`)}
              </span>
              <span className="text-[9px] text-text-secondary font-semibold">
                {t("parent_child_level", activeChildInfo.level)}
              </span>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-secondary font-semibold">GPA</span>
              <span className="text-xs font-black text-emerald-500">{activeChildInfo.gpa}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-secondary font-semibold">Points</span>
              <span className="text-xs font-black" style={{ color: 'var(--accent-orange)' }}>{activeChildInfo.points}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-secondary font-semibold">Progress</span>
              <span className="text-xs font-black text-primary">{activeChildInfo.progress}%</span>
            </div>
          </div>
        </div>

        {/* Academic GPA history chart SVG */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">GPA history Trend</span>
          <div className="flex justify-center py-2 bg-border-custom/10 rounded-2xl p-2">
            <svg width="280" height="70" className="overflow-visible">
              {/* Draw points */}
              {activeChildInfo.history.map((histVal, idx) => {
                const x = 20 + (idx / 3) * 240;
                // scale 10.0 to 18.0
                const y = 60 - ((histVal - 10) / 8) * 50;
                return (
                  <g key={idx}>
                    {idx > 0 && (
                      <line
                        x1={20 + ((idx - 1) / 3) * 240}
                        y1={60 - ((activeChildInfo.history[idx - 1] - 10) / 8) * 50}
                        x2={x}
                        y2={y}
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                      />
                    )}
                    <circle cx={x} cy={y} r="4" className="fill-white stroke-primary" strokeWidth="2.5" />
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-black fill-current text-text-primary">
                      {histVal}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Child notes */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_last_notes")}</span>
          <div className="flex flex-col gap-1.5">
            {activeChildInfo.notes.map((note, index) => (
              <p key={index} className="text-xs text-text-primary leading-relaxed pl-2 border-l-2 border-primary/40 font-semibold">
                • {note}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Parental Interactive Messages panel */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">Send Encouraging Support</h3>
        <p className="text-[11px] text-text-secondary">Messages appear instantly on the student\\'s Home page banner.</p>

        {showToast && (
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center text-[10px] font-black text-green-700 dark:text-green-400">
            💌 Support message delivered successfully!
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <textarea
            value={supportText}
            onChange={(e) => setSupportText(e.target.value)}
            placeholder={`Say something sweet to ${t(`parent_child_${selectedChild.toLowerCase()}`)}...`}
            rows={2}
            className="w-full p-3 rounded-2xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
          >
            <Send size={14} /> {t("parent_send_support")}
          </button>
        </form>
      </div>

      {/* Alerts and Logs */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">{t("parent_alerts_title")}</h3>
        <div className="flex flex-col gap-2">
          {parentAlerts.map((alert) => {
            let label = "";
            let color = "bg-primary/10 text-primary border-primary/20";
            if (alert.type === "math") {
              label = t("parent_alert_math");
              color = "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400";
            } else if (alert.type === "goal_completed") {
              label = t("parent_alert_goal_completed", t(alert.childName));
              color = "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
            } else if (alert.type === "challenge") {
              label = t("parent_alert_challenge", t(alert.childName));
              color = "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400";
            } else if (alert.type === "fatigue") {
              label = t("parent_alert_fatigue");
              color = "bg-red-100 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400";
            }

            return (
              <div key={alert.id} className={`p-2.5 rounded-xl border flex justify-between items-center gap-3 text-xs ${color}`}>
                <span className="font-bold leading-snug">{label}</span>
                <span className="text-[9px] font-black opacity-80 shrink-0">
                  {alert.isDays ? t("parent_alert_time_days", alert.timeValue) : t("parent_alert_time_hours", alert.timeValue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Admin Dashboard
   ========================================================================== */
function AdminDashboardScreen({ t }: { t: (k: string, ...a: (string | number)[]) => string }) {
  const {
    algerianLevels,
    addCustomYear,
    addCustomTrack,
    customGames,
    addCustomGame,
    studentGrades,
    studentLevels,
    moodLogs,
    updateGrade,
    appLanguage,
    registeredUsers
  } = useBloom();

  // Admin sub-tab state
  const [activeTab, setActiveTab] = useState<"levels" | "games" | "students">("students");

  // ── Levels form state ──
  const [levelCycle, setLevelCycle] = useState<AlgerianCycle>("moyen");
  const [newYearLabel, setNewYearLabel] = useState("");
  const [trackCycle, setTrackCycle] = useState<AlgerianCycle>("lycee");
  const [trackYear, setTrackYear] = useState<number>(2);
  const [newTrackName, setNewTrackName] = useState("");
  const [levelsMsg, setLevelsMsg] = useState<string | null>(null);

  // ── Game builder state ──
  const [gameType, setGameType] = useState<"quiz" | "memory">("quiz");
  const [gameTitle, setGameTitle] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [gameCycle, setGameCycle] = useState<AlgerianCycle>("moyen");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctIndex: 0 }
  ]);
  const [memEmojis, setMemEmojis] = useState("🐶,🐱,🦊,🐻,🦁,🐯");
  const [gameMsg, setGameMsg] = useState<string | null>(null);

  const students = registeredUsers
    .filter((u) => u.role === "student")
    .map((u) => u.name);

  // ── Students state ──
  const [selectedStudent, setSelectedStudent] = useState<string>("Sara");
  const [editGrade, setEditGrade] = useState<Record<string, string>>({});
  const [gradeMsg, setGradeMsg] = useState<string | null>(null);

  // Synchronize selectedStudent with students updates
  useEffect(() => {
    if (students.length > 0 && !students.includes(selectedStudent)) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  const CYCLE_LABELS: Record<AlgerianCycle, string> = {
    primaire: "Primaire",
    moyen: "Moyen (CEM)",
    lycee: "Lycée"
  };

  const MOOD_ICONS: Record<string, string> = {
    mood_happy: "😄",
    mood_sad: "😢",
    mood_anxious: "😰",
    mood_angry: "😡",
    mood_calm: "😌"
  };

  const MOOD_COLORS: Record<string, string> = {
    mood_happy: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    mood_sad: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    mood_anxious: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    mood_angry: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    mood_calm: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  };

  // ── Levels handlers ──
  const handleAddYear = () => {
    if (!newYearLabel.trim()) return;
    addCustomYear(levelCycle, newYearLabel.trim());
    setNewYearLabel("");
    setLevelsMsg("✓ Year added successfully!");
    setTimeout(() => setLevelsMsg(null), 3000);
  };

  const handleAddTrack = () => {
    if (!newTrackName.trim()) return;
    addCustomTrack(trackCycle, trackYear, newTrackName.trim());
    setNewTrackName("");
    setLevelsMsg("✓ Track added successfully!");
    setTimeout(() => setLevelsMsg(null), 3000);
  };

  // ── Game builder handlers ──
  const handleAddQuestion = () => {
    setQuizQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const handleQuestionChange = (idx: number, field: string, value: string | number) => {
    setQuizQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (field === "correctIndex") return { ...q, correctIndex: value as number };
      if (field.startsWith("opt_")) {
        const optIdx = parseInt(field.split("_")[1]);
        const newOpts = [...q.options];
        newOpts[optIdx] = value as string;
        return { ...q, options: newOpts };
      }
      return { ...q, [field]: value };
    }));
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateGame = () => {
    if (!gameTitle.trim()) { setGameMsg("❌ Please enter a game title."); return; }
    if (gameType === "quiz") {
      const validQ = quizQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
      if (validQ.length === 0) { setGameMsg("❌ Add at least one complete question."); return; }
      addCustomGame({ title: gameTitle, description: gameDesc, cycle: gameCycle, type: "quiz", questions: validQ });
    } else {
      const emojiList = memEmojis.split(",").map(e => e.trim()).filter(Boolean);
      if (emojiList.length < 3) { setGameMsg("❌ Enter at least 3 emojis separated by commas."); return; }
      addCustomGame({ title: gameTitle, description: gameDesc, cycle: gameCycle, type: "memory", emojis: emojiList });
    }
    setGameTitle(""); setGameDesc(""); setMemEmojis("🐶,🐱,🦊,🐻,🦁,🐯");
    setQuizQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    setGameMsg("✓ Game created and available to students!");
    setTimeout(() => setGameMsg(null), 4000);
  };

  // ── Grade update handler ──
  const handleGradeUpdate = (subject: string) => {
    const val = parseFloat(editGrade[subject] || "");
    if (isNaN(val) || val < 0 || val > 20) { setGradeMsg("❌ Grade must be 0–20."); return; }
    updateGrade(selectedStudent, subject, val);
    setEditGrade(prev => { const n = { ...prev }; delete n[subject]; return n; });
    setGradeMsg("✓ Grade updated!");
    setTimeout(() => setGradeMsg(null), 2500);
  };

  const studentGrade = studentGrades[selectedStudent];
  const studentLevel = studentLevels[selectedStudent];
  const studentMoods = moodLogs.filter(l => l.student === selectedStudent);

  const tabBtn = (id: "levels" | "games" | "students", label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all ${
        activeTab === id
          ? "bg-primary text-white shadow-sm"
          : "text-text-secondary hover:bg-border-custom/40"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const inputCls = "w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs text-text-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelCls = "text-[10px] font-black text-text-secondary uppercase tracking-wide";

  return (
    <>
      {/* Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="font-black text-sm text-text-primary">Admin Dashboard 🛠️</h2>
          <p className="text-[11px] text-text-secondary">Manage levels, games & monitor students</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-border-custom/20 rounded-2xl">
        {tabBtn("students", "Students", <Activity size={14} />)}
        {tabBtn("games", "Games", <Gamepad size={14} />)}
        {tabBtn("levels", "Levels", <TrendingUp size={14} />)}
      </div>

      {/* ── Tab: Students ── */}
      {activeTab === "students" && (
        <>
          {/* Student Selector */}
          <div className="flex gap-2 flex-wrap">
            {students.map(name => (
              <button
                key={name}
                onClick={() => setSelectedStudent(name)}
                className={`px-3 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  selectedStudent === name
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface border border-border-custom text-text-secondary hover:bg-border-custom/20"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Student Info Card */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-text-primary">{selectedStudent}</h3>
              {studentLevel ? (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full">
                  {studentLevel.label}
                </span>
              ) : (
                <span className="bg-border-custom/40 text-text-secondary text-[10px] font-black px-2.5 py-1 rounded-full">
                  No Level Set
                </span>
              )}
            </div>

            {studentLevel && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">Cycle</div>
                  <div className="text-xs font-black text-text-primary capitalize">{studentLevel.cycle}</div>
                </div>
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">Year</div>
                  <div className="text-xs font-black text-text-primary">{studentLevel.year}ème</div>
                </div>
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">Track</div>
                  <div className="text-[9px] font-black text-text-primary truncate">{studentLevel.track || "—"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Mood History */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <Heart size={14} className="text-red-400" />
              Emotional Wellbeing
            </h3>
            {studentMoods.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-3">No mood logs yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {studentMoods.slice(0, 5).map(log => (
                  <div key={log.id} className="flex justify-between items-center">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${MOOD_COLORS[log.mood] || "bg-border-custom/30 text-text-secondary"}`}>
                      {MOOD_ICONS[log.mood] || "😶"} {t(log.mood)}
                    </span>
                    <span className="text-[10px] text-text-secondary font-bold">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grades Editor */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <Award size={14} className="text-amber-400" />
              Academic Grades (/ 20)
            </h3>
            {gradeMsg && (
              <div className={`text-[10px] font-black p-2 rounded-xl text-center ${gradeMsg.startsWith("✓") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700"}`}>
                {gradeMsg}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {Object.entries(studentGrade).map(([subj, grade]) => (
                <div key={subj} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-text-secondary truncate">{t(subj)}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 bg-border-custom/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            grade >= 14 ? "bg-green-500" : grade >= 10 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${(grade / 20) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black w-8 text-right ${
                        grade >= 14 ? "text-green-600" : grade >= 10 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {grade}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder={String(grade)}
                      value={editGrade[subj] ?? ""}
                      onChange={e => setEditGrade(prev => ({ ...prev, [subj]: e.target.value }))}
                      className="w-14 p-1 rounded-lg border border-border-custom bg-surface text-[10px] text-center font-black text-text-primary outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => handleGradeUpdate(subj)}
                      disabled={!editGrade[subj]}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-30"
                    >
                      <Check size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Game Builder ── */}
      {activeTab === "games" && (
        <>
          {/* Existing custom games list */}
          {customGames.length > 0 && (
            <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
              <h3 className="font-black text-sm text-text-primary">Created Games ({customGames.length})</h3>
              <div className="flex flex-col gap-2">
                {customGames.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-border-custom/20">
                    <div>
                      <div className="text-xs font-black text-text-primary">{g.title}</div>
                      <div className="text-[10px] text-text-secondary">{CYCLE_LABELS[g.cycle]} · {g.type === "quiz" ? `${g.questions?.length || 0} questions` : `${g.emojis?.length || 0} emojis`}</div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${g.type === "quiz" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"}`}>
                      {g.type === "quiz" ? "Quiz" : "Memory"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game creation form */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-4">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <Plus size={14} className="text-primary" />
              Create New Game
            </h3>

            {gameMsg && (
              <div className={`text-[10px] font-black p-2.5 rounded-xl text-center ${gameMsg.startsWith("✓") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700"}`}>
                {gameMsg}
              </div>
            )}

            {/* Game type selector */}
            <div className="flex gap-2">
              {(["quiz", "memory"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setGameType(type)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all capitalize ${gameType === type ? "bg-primary text-white" : "bg-border-custom/30 text-text-secondary"}`}
                >
                  {type === "quiz" ? "📝 Quiz" : "🧠 Memory"}
                </button>
              ))}
            </div>

            {/* Common fields */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Game Title *</label>
              <input value={gameTitle} onChange={e => setGameTitle(e.target.value)} placeholder="e.g. Arabic Vocabulary Quiz" className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Description</label>
              <input value={gameDesc} onChange={e => setGameDesc(e.target.value)} placeholder="e.g. Test your Arabic vocabulary skills" className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Target Cycle *</label>
              <select value={gameCycle} onChange={e => setGameCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">Primaire (1–5)</option>
                <option value="moyen">Moyen / CEM (6–9)</option>
                <option value="lycee">Lycée (10–12)</option>
              </select>
            </div>

            {/* Quiz specific */}
            {gameType === "quiz" && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Questions</label>
                  <button onClick={handleAddQuestion} className="text-[10px] font-black text-primary flex items-center gap-1 hover:underline">
                    <Plus size={11} /> Add Question
                  </button>
                </div>
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-border-custom/20 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-text-secondary">Q{idx + 1}</span>
                      {quizQuestions.length > 1 && (
                        <button onClick={() => handleRemoveQuestion(idx)} className="text-red-400 hover:text-red-600">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <input
                      value={q.question}
                      onChange={e => handleQuestionChange(idx, "question", e.target.value)}
                      placeholder="Question text..."
                      className={inputCls}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`correct_${idx}`}
                            checked={q.correctIndex === oi}
                            onChange={() => handleQuestionChange(idx, "correctIndex", oi)}
                            className="accent-primary"
                          />
                          <input
                            value={opt}
                            onChange={e => handleQuestionChange(idx, `opt_${oi}`, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 p-1.5 rounded-lg border border-border-custom bg-surface text-[10px] text-text-primary outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-text-secondary">🔘 Select the radio button next to the correct answer</p>
                  </div>
                ))}
              </div>
            )}

            {/* Memory specific */}
            {gameType === "memory" && (
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Emojis (comma-separated, min 3)</label>
                <input
                  value={memEmojis}
                  onChange={e => setMemEmojis(e.target.value)}
                  placeholder="🐶,🐱,🦊,🐻,🦁,🐯"
                  className={inputCls}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {memEmojis.split(",").map(e => e.trim()).filter(Boolean).map((emoji, i) => (
                    <span key={i} className="text-lg">{emoji}</span>
                  ))}
                </div>
                <p className="text-[9px] text-text-secondary">Cards will be doubled automatically for matching pairs.</p>
              </div>
            )}

            <button
              onClick={handleCreateGame}
              className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              Create & Publish Game
            </button>
          </div>
        </>
      )}

      {/* ── Tab: Levels ── */}
      {activeTab === "levels" && (
        <>
          {/* Current levels tree */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              Current Levels Structure
            </h3>
            {algerianLevels.map(cycle => (
              <div key={cycle.cycle} className="flex flex-col gap-1">
                <div className="text-[10px] font-black text-primary uppercase tracking-wide py-0.5">{cycle.label}</div>
                {cycle.years.map(yr => (
                  <div key={yr.year} className="ml-3 pl-2 border-l-2 border-border-custom/50">
                    <div className="text-xs font-bold text-text-primary">{yr.label}</div>
                    {yr.tracks && yr.tracks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {yr.tracks.map(track => (
                          <span key={track} className="text-[9px] bg-border-custom/40 text-text-secondary px-1.5 py-0.5 rounded-full">{track}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {levelsMsg && (
            <div className="text-[11px] font-black p-2.5 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-center">
              {levelsMsg}
            </div>
          )}

          {/* Add Year form */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <Plus size={14} className="text-primary" />
              Add New Year
            </h3>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Cycle</label>
              <select value={levelCycle} onChange={e => setLevelCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">Primaire</option>
                <option value="moyen">Moyen (CEM)</option>
                <option value="lycee">Lycée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Year Label *</label>
              <input value={newYearLabel} onChange={e => setNewYearLabel(e.target.value)} placeholder='e.g. 6ème AP' className={inputCls} />
            </div>
            <button onClick={handleAddYear} className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black transition-all hover:bg-primary/95">
              Add Year
            </button>
          </div>

          {/* Add Track form */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <ChevronRight size={14} className="text-primary" />
              Add New Track to Year
            </h3>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Cycle</label>
              <select value={trackCycle} onChange={e => setTrackCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">Primaire</option>
                <option value="moyen">Moyen (CEM)</option>
                <option value="lycee">Lycée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Year Number *</label>
              <input
                type="number"
                min="1"
                value={trackYear}
                onChange={e => setTrackYear(parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Track Name *</label>
              <input value={newTrackName} onChange={e => setNewTrackName(e.target.value)} placeholder='e.g. Arts Plastiques' className={inputCls} />
            </div>
            <button onClick={handleAddTrack} className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black transition-all hover:bg-primary/95">
              Add Track
            </button>
          </div>
        </>
      )}
    </>
  );
}

