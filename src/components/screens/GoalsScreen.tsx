"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Goal, GoalPeriod, useBloom } from "@/context/BloomContext";
import { CalendarDays, ListChecks, Plus, Trash2, X } from "lucide-react";

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
  addGoal: (title: string, target: number, studentName?: string, period?: GoalPeriod) => void;
  addPoints: (pts: number) => void;
}) {
  const { userRole, currentUser } = useBloom();
  // The active student: a logged-in student acts as themselves, otherwise the
  // parent account runs the student experience as the first/default child.
  const activeStudentName = userRole === "youth" && currentUser?.name ? currentUser.name : "Sara";
  // Show shared goals for this child plus legacy goals without an owner.
  const [periodFilter, setPeriodFilter] = useState<GoalPeriod | "all">("all");
  const visibleGoals = goals.filter(g => (!g.studentName || g.studentName === activeStudentName) && (periodFilter === "all" || (g.period ?? "weekly") === periodFilter));
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newTarget, setNewTarget] = useState<number>(5);
  const [newPeriod, setNewPeriod] = useState<GoalPeriod>("weekly");

  const goalSuggestions = [
    { title: "goal_math" },
    { title: "goal_reading" },
    { title: "goal_exercises" },
    { title: "goal_water" },
    { title: "goal_sport" }
  ];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addGoal(newTitle, newTarget, activeStudentName, newPeriod);
    setNewTitle("");
    setNewTarget(5);
    setNewPeriod("weekly");
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
          <p className="text-[11px] text-text-secondary">{t("goals_progress_hint")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-primary text-white py-2 px-3.5 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-xs"
        >
          <Plus size={14} /> {t("goals_add_goal")}
        </button>
      </div>

      {/* Weekly / Monthly filter */}
      <div className="flex items-center gap-2 px-1">
        <span className="flex items-center gap-1 text-[10px] font-black text-text-secondary">
          <CalendarDays size={13} /> {t("goals_period_label")}:
        </span>
        {(["all", "weekly", "monthly"] as (GoalPeriod | "all")[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriodFilter(p)}
            className={`py-1 px-3 rounded-full text-[10px] font-black border transition-all ${
              periodFilter === p
                ? "bg-primary text-white border-primary"
                : "border-border-custom text-text-secondary hover:bg-border-custom/50"
            }`}
          >
            {t(p === "all" ? "goals_period_all" : p === "weekly" ? "goals_period_weekly" : "goals_period_monthly")}
          </button>
        ))}
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
                    placeholder={t("goals_title_placeholder")}
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
                        {t(sug.title)}
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

                {/* Period selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("goals_period_label")}</label>
                  <div className="flex gap-2">
                    {(["weekly", "monthly"] as GoalPeriod[]).map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNewPeriod(p)}
                        className={`flex-1 py-2.5 rounded-xl border text-[11px] font-black transition-all ${
                          newPeriod === p
                            ? "bg-primary text-white border-primary"
                            : "border-border-custom text-text-secondary hover:bg-border-custom/50"
                        }`}
                      >
                        {t(p === "weekly" ? "goals_period_weekly" : "goals_period_monthly")}
                      </button>
                    ))}
                  </div>
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
        {visibleGoals.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-3xl border border-border-custom/50 p-6">
            <ListChecks className="text-border-custom mx-auto mb-3" size={48} />
            <p className="text-xs font-bold text-text-secondary whitespace-pre-line leading-relaxed">
              {t("goals_empty")}
            </p>
          </div>
        ) : (
          visibleGoals.map((goal) => {
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
                      <span className="text-[9px] text-text-secondary font-semibold">{t("goals_active_badge")}</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[9px] text-text-secondary font-bold">
                      <CalendarDays size={10} />
                      {t((goal.period ?? "weekly") === "weekly" ? "goals_period_weekly" : "goals_period_monthly")}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 hover:scale-105 active:scale-95 transition-all"
                      aria-label={t("goals_delete_label")}
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
/* ==========================================================================
   SCREEN: Kids Play Time Lock (30-min daily limit reached)
   ========================================================================== */

export default GoalsScreen;
