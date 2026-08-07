"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBloom, Goal, StudentGrades } from "@/context/BloomContext";
import { TrendingUp, Heart, Plus, Check, X, Clock, Sparkles, Trophy, Flame } from "lucide-react";

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
  const { currentUser, studentGrades, userRole, dailyChallenges, toggleDailyChallenge, challengeStreak, challengeBestStreak } = useBloom();
  const [moodTip, setMoodTip] = useState<string | null>(null);
  const [celebrateGoalId, setCelebrateGoalId] = useState<string | null>(null);
  
  // Get active student name
  const studentName = userRole === "youth" ? (currentUser?.name || "Sara") : "Sara";
  const grades = studentGrades[studentName] || {};
  
  // Calculate GPA dynamically out of 20
  const subjectKeys = Object.keys(grades);
  const totalSubjects = subjectKeys.length;
  const gradesSum = subjectKeys.reduce((acc, k) => acc + grades[k], 0);
  const currentGPA = totalSubjects > 0 ? parseFloat((gradesSum / totalSubjects).toFixed(2)) : 16.8;

  // Last 7 days of challenge history for the mini-calendar (most recent first)
  const challengeWeek = (() => {
    const days: { key: string; dow: string; done: boolean; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dow = ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
      days.push({
        key,
        dow,
        done: !!(dailyChallenges.history ?? {})[key],
        isToday: i === 0,
      });
    }
    return days;
  })();

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
              {t("home_greeting", studentName)}
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
                  {t("home_breathing_exercise")}
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

      {/* Daily Learning Challenges */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249, 213, 110, 0.2)" }}>
              <Trophy size={18} className="text-yellow-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-text-primary">{t("home_challenge_title")}</span>
              <span className="text-[9px] text-text-secondary">{t("home_challenge_subtitle")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1">
              <Flame size={12} className="text-orange-500" />
              <span className="text-[10px] font-black text-orange-500">{challengeStreak}</span>
              <span className="text-[9px] font-bold text-text-secondary">{t("challenge_streak")}</span>
            </div>
            <span className="text-[10px] font-black text-primary bg-primary/10 py-1 px-2.5 rounded-full">
              {dailyChallenges.tasks.filter(c => c.done).length} / {dailyChallenges.tasks.length}
            </span>
          </div>
        </div>
        {/* Weekly streak mini-calendar */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {challengeWeek.map(day => (
            <div key={day.key} className="flex flex-col items-center gap-1 flex-1">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                day.done
                  ? "bg-green-500 border-green-500 text-white"
                  : day.isToday
                    ? "border-primary text-primary"
                    : "border-border-custom text-text-secondary"
              }`}>
                {day.done ? <Check size={12} /> : day.dow}
              </span>
              <span className={`text-[8px] font-bold ${day.isToday ? "text-primary" : "text-text-secondary"}`}>
                {day.isToday ? t("challenge_today") : day.dow}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {dailyChallenges.tasks.map(task => (
            <button
              key={task.id}
              onClick={() => toggleDailyChallenge(task.id)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left ${
                task.done
                  ? "border-green-500/30 bg-green-50/60 dark:bg-green-950/20"
                  : "border-border-custom hover:bg-border-custom/30 active:scale-[0.99]"
              }`}
            >
              <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                task.done ? "bg-green-500 border-green-500" : "border-border-custom"
              }`}>
                {task.done && <Check size={12} className="text-white" />}
              </span>
              <span className={`flex-1 text-[11px] font-black ${task.done ? "line-through text-text-secondary" : "text-text-primary"}`}>
                {t(task.labelKey)}
              </span>
              <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 shrink-0">+20</span>
            </button>
          ))}
        </div>
      </div>

      {/* Algerian School Week Schedule & Prayer Times widgets */}
      <div className="flex flex-col gap-3">
        {/* School Week Calendar Card */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs font-black text-text-primary">{t("school_calendar_title")}</span>
              <span className="text-[9px] text-text-secondary">{t("home_schedule_agenda")}</span>
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
                  {t("home_algeria_syllabus")}
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
              <p className="text-[9px] text-text-secondary mt-0.5">{t("home_prayer_wilaya")}</p>
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
                      {t("home_prayer_next")}
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
              {t("home_no_active_goals")}
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

export default HomeScreen;
