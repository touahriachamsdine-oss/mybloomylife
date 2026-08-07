"use client";
import React, { useMemo } from "react";
import {
  Award,
  BookOpen,
  CalendarCheck,
  Flag,
  GraduationCap,
  Heart,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import { useBloom } from "@/context/BloomContext";

const BADGES: { id: string; key: string; icon: React.ReactNode; descKey: string; unlocked: (ctx: Stats) => boolean }[] = [
  {
    id: "first_steps",
    key: "portfolio_badge_first_steps",
    icon: <GraduationCap size={22} />,
    descKey: "portfolio_badge_first_steps_desc",
    unlocked: (s) => s.points >= 100,
  },
  {
    id: "goal_getter",
    key: "portfolio_badge_goal_getter",
    icon: <Target size={22} />,
    descKey: "portfolio_badge_goal_getter_desc",
    unlocked: (s) => s.completedGoals >= 1,
  },
  {
    id: "journal_writer",
    key: "portfolio_badge_journal_writer",
    icon: <BookOpen size={22} />,
    descKey: "portfolio_badge_journal_writer_desc",
    unlocked: (s) => s.learningEntries >= 5,
  },
  {
    id: "gratitude_heart",
    key: "portfolio_badge_gratitude_heart",
    icon: <Heart size={22} />,
    descKey: "portfolio_badge_gratitude_heart_desc",
    unlocked: (s) => s.gratitudeEntries >= 5,
  },
  {
    id: "planner_pro",
    key: "portfolio_badge_planner_pro",
    icon: <CalendarCheck size={22} />,
    descKey: "portfolio_badge_planner_pro_desc",
    unlocked: (s) => s.completedSlots >= 10,
  },
  {
    id: "focus_master",
    key: "portfolio_badge_focus_master",
    icon: <Trophy size={22} />,
    descKey: "portfolio_badge_focus_master_desc",
    unlocked: (s) => s.priorityDone >= 10,
  },
];

interface Stats {
  points: number;
  completedGoals: number;
  learningEntries: number;
  gratitudeEntries: number;
  completedSlots: number;
  priorityDone: number;
  moodDays: number;
}

function PortfolioScreen({ t }: { t: (k: string, ...a: (string | number)[]) => string }) {
  const {
    userPoints,
    goals,
    learningEntries,
    gratitudeEntries,
    studyPlan,
    priorityTasks,
    moodLogs,
    userRole,
    currentUser,
  } = useBloom();

  const activeStudentName = userRole === "youth" && currentUser?.name ? currentUser.name : "Sara";

  const stats: Stats = useMemo(() => {
    const visibleGoals = goals.filter(g => !g.studentName || g.studentName === activeStudentName);
    return {
      points: userPoints,
      completedGoals: visibleGoals.filter(g => g.currentProgress >= g.targetProgress).length,
      learningEntries: learningEntries.length,
      gratitudeEntries: gratitudeEntries.length,
      completedSlots: studyPlan.filter(s => s.done).length,
      priorityDone: priorityTasks.filter(p => p.done).length,
      moodDays: new Set(moodLogs.map(m => m.date ?? "")).size,
    };
  }, [userPoints, goals, learningEntries, gratitudeEntries, studyPlan, priorityTasks, moodLogs, activeStudentName]);

  const unlockedCount = BADGES.filter(b => b.unlocked(stats)).length;

  const statCards: { labelKey: string; value: number; icon: React.ReactNode }[] = [
    { labelKey: "portfolio_stat_points", value: stats.points, icon: <Sparkles size={16} /> },
    { labelKey: "portfolio_stat_goals", value: stats.completedGoals, icon: <Target size={16} /> },
    { labelKey: "portfolio_stat_learning", value: stats.learningEntries, icon: <BookOpen size={16} /> },
    { labelKey: "portfolio_stat_gratitude", value: stats.gratitudeEntries, icon: <Heart size={16} /> },
    { labelKey: "portfolio_stat_slots", value: stats.completedSlots, icon: <CalendarCheck size={16} /> },
    { labelKey: "portfolio_stat_mood", value: stats.moodDays, icon: <Flag size={16} /> },
  ];

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs">
        <h2 className="text-sm font-black text-text-primary">{t("portfolio_title")}</h2>
        <p className="text-[11px] text-text-secondary">{t("portfolio_subtitle")}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map(card => (
          <div key={card.labelKey} className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex flex-col items-center gap-1">
            <span className="text-primary">{card.icon}</span>
            <span className="text-base font-black text-text-primary">{card.value}</span>
            <span className="text-[9px] font-bold text-text-secondary text-center leading-tight">{t(card.labelKey)}</span>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-xs font-black text-text-primary">
            <Award size={15} className="text-primary" /> {t("portfolio_badges_title")}
          </span>
          <span className="text-[10px] font-black text-primary">
            {unlockedCount} / {BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {BADGES.map(badge => {
            const isUnlocked = badge.unlocked(stats);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                  isUnlocked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border-custom opacity-45 grayscale"
                }`}
              >
                <span className={`${isUnlocked ? "text-primary" : "text-text-secondary"}`}>{badge.icon}</span>
                <span className={`text-[10px] font-black leading-tight ${isUnlocked ? "text-text-primary" : "text-text-secondary"}`}>
                  {t(badge.key)}
                </span>
                <span className="text-[8px] font-semibold text-text-secondary leading-tight">{t(badge.descKey)}</span>
                <span className={`text-[8px] font-black mt-0.5 ${isUnlocked ? "text-green-600 dark:text-green-400" : "text-text-secondary"}`}>
                  {isUnlocked ? t("portfolio_unlocked") : t("portfolio_locked")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encouragement */}
      <div className="p-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-xs">
        <p className="text-[11px] font-black text-text-primary text-center leading-relaxed whitespace-pre-line">
          {t("portfolio_encouragement")}
        </p>
      </div>
    </>
  );
}

export default PortfolioScreen;
