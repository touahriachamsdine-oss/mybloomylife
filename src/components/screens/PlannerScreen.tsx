"use client";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Flag, ListChecks, Plus, Trash2, X } from "lucide-react";
import {
  PriorityTask,
  TaskPriority,
  StudyPlanEntry,
  useBloom
} from "@/context/BloomContext";

const DAY_KEYS = ["planner_day_sun", "planner_day_mon", "planner_day_tue", "planner_day_wed", "planner_day_thu"];

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_LABEL_KEY: Record<TaskPriority, string> = {
  high: "planner_priority_high",
  medium: "planner_priority_medium",
  low: "planner_priority_low",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

function PlannerScreen({
  t,
  studyPlan,
  addStudyPlanEntry,
  removeStudyPlanEntry,
  toggleStudyPlanDone,
  priorityTasks,
  addPriorityTask,
  removePriorityTask,
  togglePriorityTask
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  studyPlan: StudyPlanEntry[];
  addStudyPlanEntry: (entry: Omit<StudyPlanEntry, "id" | "done">) => void;
  removeStudyPlanEntry: (id: string) => void;
  toggleStudyPlanDone: (id: string) => void;
  priorityTasks: PriorityTask[];
  addPriorityTask: (task: Omit<PriorityTask, "id">) => void;
  removePriorityTask: (id: string) => void;
  togglePriorityTask: (id: string) => void;
}) {
  const [activeDay, setActiveDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 0 && today <= 4 ? today : 0;
  });
  const [slotTime, setSlotTime] = useState<string>("17:00");
  const [slotSubject, setSlotSubject] = useState<string>("");
  const [showSlotForm, setShowSlotForm] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("high");
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);

  const daySlots = useMemo(
    () => studyPlan.filter(s => s.day === activeDay).sort((a, b) => a.time.localeCompare(b.time)),
    [studyPlan, activeDay]
  );

  const sortedTasks = useMemo(
    () =>
      [...priorityTasks].sort((a, b) =>
        a.done === b.done ? PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] : a.done ? 1 : -1
      ),
    [priorityTasks]
  );

  const subjectSuggestions = ["planner_subject_math", "planner_subject_arabic", "planner_subject_french", "planner_subject_physics", "planner_subject_sciences"];

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSubject.trim()) return;
    addStudyPlanEntry({ day: activeDay, time: slotTime, subject: slotSubject });
    setSlotSubject("");
    setShowSlotForm(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addPriorityTask({ title: taskTitle, priority: taskPriority, done: false });
    setTaskTitle("");
    setTaskPriority("high");
    setShowTaskForm(false);
  };

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs">
        <h2 className="text-sm font-black text-text-primary">{t("planner_title")}</h2>
        <p className="text-[11px] text-text-secondary">{t("planner_subtitle")}</p>
      </div>

      {/* ===== Revision timetable ===== */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-xs font-black text-text-primary">
            <CalendarClock size={15} className="text-primary" /> {t("planner_revision_title")}
          </span>
          <button
            onClick={() => setShowSlotForm(true)}
            className="flex items-center gap-1 bg-primary text-white py-1.5 px-3 rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={12} /> {t("planner_add_slot")}
          </button>
        </div>

        {/* Day selector */}
        <div className="grid grid-cols-5 gap-1.5">
          {DAY_KEYS.map((key, idx) => (
            <button
              key={key}
              onClick={() => setActiveDay(idx)}
              className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
                activeDay === idx
                  ? "bg-primary text-white border-primary"
                  : "border-border-custom text-text-secondary hover:bg-border-custom/50"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>

        {/* Slots for the active day */}
        {daySlots.length === 0 ? (
          <div className="text-center py-6 bg-border-custom/20 rounded-2xl">
            <p className="text-[11px] font-bold text-text-secondary whitespace-pre-line leading-relaxed">
              {t("planner_slots_empty")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {daySlots.map(slot => (
              <div
                key={slot.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  slot.done ? "border-green-500/30 bg-green-50/60 dark:bg-green-950/20" : "border-border-custom"
                }`}
              >
                <button
                  onClick={() => toggleStudyPlanDone(slot.id)}
                  aria-label={t("planner_toggle_done")}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    slot.done ? "bg-green-500 border-green-500" : "border-border-custom hover:border-primary"
                  }`}
                >
                  {slot.done && <span className="text-[10px] text-white font-black">✓</span>}
                </button>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[11px] font-black truncate ${slot.done ? "line-through text-text-secondary" : "text-text-primary"}`}>
                    {t(slot.subject)}
                  </span>
                  <span className="text-[9px] text-text-secondary font-bold font-mono">{slot.time}</span>
                </div>
                <button
                  onClick={() => removeStudyPlanEntry(slot.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 hover:scale-105 transition-all"
                  aria-label={t("planner_delete_slot")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add slot modal */}
      <AnimatePresence>
        {showSlotForm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-4 text-text-primary"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">{t("planner_add_new_slot")}</span>
                <button onClick={() => setShowSlotForm(false)} className="p-1 rounded-full hover:bg-border-custom/50">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddSlot} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("planner_slot_subject")}</label>
                  <input
                    type="text"
                    value={slotSubject}
                    onChange={(e) => setSlotSubject(e.target.value)}
                    placeholder={t("planner_slot_subject_placeholder")}
                    className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subjectSuggestions.map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSlotSubject(s)}
                        className={`text-[9px] font-bold py-1 px-2.5 rounded-full border transition-all ${
                          slotSubject === s
                            ? "bg-primary text-white border-primary"
                            : "border-border-custom hover:bg-border-custom/50 text-text-secondary"
                        }`}
                      >
                        {t(s)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("planner_slot_time")}</label>
                  <input
                    type="time"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSlotForm(false)}
                    className="flex-1 bg-border-custom hover:bg-border-custom/80 py-3.5 rounded-xl text-xs font-bold transition-all text-text-primary"
                  >
                    {t("goals_cancel_btn")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/95 py-3.5 rounded-xl text-xs font-black text-white transition-all shadow-xs"
                  >
                    {t("planner_add_slot")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Priority tasks ===== */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-xs font-black text-text-primary">
            <Flag size={15} className="text-primary" /> {t("planner_priorities_title")}
          </span>
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-1 bg-primary text-white py-1.5 px-3 rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={12} /> {t("planner_add_task")}
          </button>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="text-center py-6 bg-border-custom/20 rounded-2xl">
            <ListChecks className="text-border-custom mx-auto mb-2" size={28} />
            <p className="text-[11px] font-bold text-text-secondary whitespace-pre-line leading-relaxed">
              {t("planner_tasks_empty")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedTasks.map((task, idx) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  task.done ? "border-green-500/30 bg-green-50/60 dark:bg-green-950/20" : "border-border-custom"
                }`}
              >
                <span className="shrink-0 w-5 h-5 rounded-lg bg-border-custom/50 text-text-secondary text-[9px] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <button
                  onClick={() => togglePriorityTask(task.id)}
                  aria-label={t("planner_toggle_done")}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.done ? "bg-green-500 border-green-500" : "border-border-custom hover:border-primary"
                  }`}
                >
                  {task.done && <span className="text-[10px] text-white font-black">✓</span>}
                </button>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[11px] font-black truncate ${task.done ? "line-through text-text-secondary" : "text-text-primary"}`}>
                    {t(task.title)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLOR[task.priority]}`} />
                    <span className="text-[9px] text-text-secondary font-bold">{t(PRIORITY_LABEL_KEY[task.priority])}</span>
                  </div>
                </div>
                <button
                  onClick={() => removePriorityTask(task.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 hover:scale-105 transition-all"
                  aria-label={t("planner_delete_task")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add priority task modal */}
      <AnimatePresence>
        {showTaskForm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-4 text-text-primary"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">{t("planner_add_new_task")}</span>
                <button onClick={() => setShowTaskForm(false)} className="p-1 rounded-full hover:bg-border-custom/50">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("planner_task_title")}</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={t("planner_task_placeholder")}
                    className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-text-secondary">{t("planner_priority_label")}</label>
                  <div className="flex gap-2">
                    {(["high", "medium", "low"] as TaskPriority[]).map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTaskPriority(p)}
                        className={`flex-1 py-2.5 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${
                          taskPriority === p
                            ? "bg-primary text-white border-primary"
                            : "border-border-custom text-text-secondary hover:bg-border-custom/50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[p]}`} />
                        {t(PRIORITY_LABEL_KEY[p])}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 bg-border-custom hover:bg-border-custom/80 py-3.5 rounded-xl text-xs font-bold transition-all text-text-primary"
                  >
                    {t("goals_cancel_btn")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/95 py-3.5 rounded-xl text-xs font-black text-white transition-all shadow-xs"
                  >
                    {t("planner_add_task")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PlannerScreen;
