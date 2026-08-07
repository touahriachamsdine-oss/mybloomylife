"use client";
import React, { useState, useEffect } from "react";
import { useBloom, StudentGrades } from "@/context/BloomContext";
import { X, Award, Activity, GraduationCap, LifeBuoy, Send } from "lucide-react";

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
  const { userRole, currentUser, moodLogs, studentGrades, isRtl, guidanceNotes, updateGuidanceNotes, requestHelp } = useBloom();
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"in" | "hold" | "out">("in");
  const [breathingTimer, setBreathingTimer] = useState<number>(60);
  const [showBreathingComplete, setShowBreathingComplete] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>("");
  const [helpSent, setHelpSent] = useState<boolean>(false);

  const handleSendHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpMessage.trim()) return;
    requestHelp(helpMessage.trim());
    setHelpMessage("");
    setHelpSent(true);
  };

  const students = Object.keys(studentGrades);

  const [newAdvice, setNewAdvice] = useState("");
  const [adviceStudent, setAdviceStudent] = useState<string>("Sara");

  // Keep adviceStudent updated if students list changes
  useEffect(() => {
    if (students.length > 0 && !students.includes(adviceStudent)) {
      setAdviceStudent(students[0]);
    }
  }, [students, adviceStudent]);

  const saveAdvice = (student: string, notesList: string[]) => {
    updateGuidanceNotes(student, notesList);
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

  const activeStudentName = (userRole === "youth" && currentUser?.name) ? currentUser.name : "Sara";
  const activeStudentAdvice = guidanceNotes[activeStudentName] || [];

  // === PSYCHOLOGIST PORTAL ===
  if (userRole === "psychologist") {
    return (
      <>
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1">
          <h2 className="text-base font-black text-text-primary">{t("psy_portal_title")}</h2>
          <p className="text-[11px] text-text-secondary">{t("psy_portal_subtitle")}</p>
        </div>

        {/* Student Mood Logs */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">{t("psy_recent_mood_logs")}</h3>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
            {moodLogs.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">{t("psy_no_mood_logs")}</p>
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
          <h3 className="font-black text-sm text-text-primary">{t("psy_post_guidance")}</h3>
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
              placeholder={t("psy_advice_placeholder", adviceStudent)}
              rows={2} required
              className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold" />
            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-black shadow-xs hover:opacity-90 transition-all">
              {t("psy_post_advice")}
            </button>
          </form>
        </div>

        {/* Advice History by Student */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">{t("psy_advice_history")}</h3>
          <div className="flex flex-col gap-3">
            {students.map((studentName) => {
              const notes = guidanceNotes[studentName] || [];
              return (
                <div key={studentName} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    {t(`parent_child_${studentName.toLowerCase()}`).startsWith("parent_child_") ? studentName : t(`parent_child_${studentName.toLowerCase()}`)} ({notes.length})
                  </span>
                  {notes.length === 0 ? (
                    <p className="text-[10px] text-text-secondary italic pl-2">{t("psy_no_advice")}</p>
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

        {/* Mood Trends */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">{t("psy_mood_trend")}</h3>
          <div className="flex flex-col gap-2">
            {students.map(sName => {
              const studentMoods = moodLogs.filter(m => m.student === sName);
              if (studentMoods.length === 0) return null;
              const counts: Record<string, number> = {};
              studentMoods.forEach(m => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
              const total = studentMoods.length;
              return (
                <div key={sName} className="flex flex-col gap-1 p-2 rounded-xl bg-border-custom/10">
                  <span className="text-xs font-black text-text-primary">{sName}</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(counts).map(([mood, count]) => (
                      <div key={mood} className="flex items-center gap-1 text-[10px] bg-surface rounded-lg px-2 py-1 border border-border-custom/50">
                        <span>{moodEmojis[mood] || "😊"}</span>
                        <span className="font-bold text-text-primary">{count}</span>
                        <span className="text-text-secondary">({Math.round(count / total * 100)}%)</span>
                      </div>
                    ))}
                  </div>
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
                <span>{t("psy_guidance_from_counselor")}</span>
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
                  <p className="text-sm font-black text-green-700 dark:text-green-400">{t("psy_exercise_completed")}</p>
                  <p className="text-[10px] text-text-secondary mt-1">{t("psy_score_boosted")}</p>
                </div>
                <button
                  onClick={() => setShowBreathingComplete(false)}
                  className="px-5 py-2 bg-green-500 text-white font-bold text-xs rounded-xl hover:bg-green-600 transition-all"
                >
                  {t("psy_okay")}
                </button>
              </div>
            ) : breathingActive ? (
              /* Animated breathing session screen */
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-border-custom/50 flex flex-col items-center gap-6 py-8">
                <div className="flex items-center justify-between w-full text-xs font-black text-text-secondary">
                  <span>{t("psy_time_left", breathingTimer)}</span>
                  <button onClick={handleStopBreathing} className="text-red-500 flex items-center gap-0.5">
                    <X size={14} /> {t("psy_stop")}
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
                    {breathingPhase === "in" && t("psy_inhale")}
                    {breathingPhase === "hold" && t("psy_hold")}
                    {breathingPhase === "out" && t("psy_exhale")}
                  </div>
                </div>

                <p className="text-xs font-semibold text-text-secondary text-center px-4 leading-relaxed">
                  {breathingPhase === "in" && t("psy_breath_in_desc")}
                  {breathingPhase === "hold" && t("psy_breath_hold_desc")}
                  {breathingPhase === "out" && t("psy_breath_out_desc")}
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
                    <span className="text-xs text-text-secondary font-black italic">{t("psy_offline_activity")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam-Pressure Coping Tips */}
          <div className="p-4 rounded-3xl bg-surface border border-primary/20 shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-1.5">
              <GraduationCap size={16} className="text-primary" />
              {t("psy_exam_title")}
            </h3>
            <p className="text-[10px] text-text-secondary -mt-1.5">{t("psy_exam_subtitle")}</p>
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-border-custom/10 border border-border-custom/50">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-text-primary leading-relaxed font-semibold">{t(`psy_exam_tip_${i + 1}`)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ask for Help */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-1.5">
              <LifeBuoy size={16} className="text-primary" />
              {t("psy_help_title")}
            </h3>
            <p className="text-[10px] text-text-secondary -mt-1.5">{t("psy_help_subtitle")}</p>
            {helpSent ? (
              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-[11px] font-black text-green-600 dark:text-green-400">{t("psy_help_sent")}</p>
              </div>
            ) : (
              <form onSubmit={handleSendHelp} className="flex flex-col gap-2">
                <textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder={t("psy_help_placeholder")}
                  rows={2}
                  required
                  className="w-full p-3 rounded-2xl border border-border-custom bg-surface text-[11px] focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-2xl text-[11px] font-black shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Send size={13} /> {t("psy_help_send")}
                </button>
              </form>
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
   SCREEN: Learning Journal Screen (سجل التعلمات)
   ========================================================================== */

export default PsychologicalScreen;
