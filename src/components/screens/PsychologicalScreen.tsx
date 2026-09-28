"use client";
import React, { useState, useEffect, useRef } from "react";
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
  const { userRole, currentUser, moodLogs, studentGrades, isRtl, guidanceNotes, updateGuidanceNotes, requestHelp, studentAssignments, studentRisks, setStudentRisk } = useBloom();
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"in" | "hold" | "out">("in");
  const [breathingTimer, setBreathingTimer] = useState<number>(60);
  const [showBreathingComplete, setShowBreathingComplete] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>("");
  // Local, so a student can ask again after a second problem - the previous
  // version flipped this once per mount and the form stayed permanently
  // replaced by a "sent" panel for the rest of the session, hiding the only
  // way to request more help.
  const [lastHelpSentAt, setLastHelpSentAt] = useState<number>(0);

  const [helpConfirmVisible, setHelpConfirmVisible] = useState(false);

  // The confirmation is a 4s acknowledgement, not a state machine. Driving it
  // from the handler (with a ref-held timer) keeps the form restorable and
  // avoids a setState-in-effect cascade on every mount.
  const helpConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (helpConfirmTimer.current) clearTimeout(helpConfirmTimer.current);
  }, []);

  const handleSendHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpMessage.trim()) return;
    requestHelp(helpMessage.trim());
    setHelpMessage("");
    setLastHelpSentAt(Date.now());
    setHelpConfirmVisible(true);
    if (helpConfirmTimer.current) clearTimeout(helpConfirmTimer.current);
    helpConfirmTimer.current = setTimeout(() => setHelpConfirmVisible(false), 4000);
  };

  // Psychologists only see students the admin assigned to them; otherwise
  // (no assignments configured yet) keep the previous behavior (all students).
  const allStudentNames = Object.keys(studentGrades);
  const hasAnyPsyAssignment = Object.values(studentAssignments).some(a => (a.psychologists || []).length > 0);
  const students =
    userRole === "psychologist" && hasAnyPsyAssignment
      ? allStudentNames.filter(name => (studentAssignments[name]?.psychologists || []).includes(currentUser?.email ?? ""))
      : allStudentNames;

  const [newAdvice, setNewAdvice] = useState("");
  // No default student: a psychologist must pick from their own caseload, not
  // be pre-loaded onto a child the admin may not have assigned them.
  const [adviceStudent, setAdviceStudent] = useState<string>("");
  const [riskNote, setRiskNote] = useState<string>("");

  // Localized student label, falling back to the raw name when the student has
  // no dedicated translation (e.g. an admin-created student).
  const displayStudent = (name: string) => {
    const key = `parent_child_${name.toLowerCase()}`;
    const label = t(key);
    return label.startsWith("parent_child_") ? name : label;
  };

  // Mood rows restricted to this psychologist's caseload. Reading moodLogs
  // directly would expose unassigned students to the wrong psychologist.
  // Sorted newest-first explicitly rather than relying on array order, so the
  // "recent" feed stays correct for data loaded from storage.
  const caseloadMoodLogs = moodLogs
    .filter((m) => students.includes(m.student))
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

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
    // No student selected means the note has no subject; refuse rather than
    // file clinical advice against an empty or placeholder record.
    if (!newAdvice.trim() || !adviceStudent) return;
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

  // Resolved from the signed-in child only. The old "Sara" fallback showed a
  // parent's or staff member's own view of another child's private guidance.
  const activeStudentName = userRole === "youth" ? currentUser?.name || "" : "";
  const activeStudentAdvice = activeStudentName ? guidanceNotes[activeStudentName] || [] : [];

  // === PSYCHOLOGIST PORTAL ===
  if (userRole === "psychologist") {
    return (
      <>
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1">
          <h2 className="text-base font-black text-text-primary">{t("psy_portal_title")}</h2>
          <p className="text-[11px] text-text-secondary">{t("psy_portal_subtitle")}</p>
        </div>

        {/* Caseload roster + risk flags */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-text-primary">{t("psy_caseload_title")}</h3>
            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black">
              {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">{t("psy_caseload_empty")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {students.map((name) => {
                const risk = studentRisks[name];
                const noteCount = (guidanceNotes[name] || []).length;
                const moodCount = caseloadMoodLogs.filter((m) => m.student === name).length;
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => setAdviceStudent(name)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-start transition-all ${
                      adviceStudent === name
                        ? "border-primary bg-primary/5"
                        : "border-border-custom bg-border-custom/10 hover:bg-border-custom/20"
                    }`}
                  >
                    <span className="text-xs font-black text-text-primary truncate">{displayStudent(name)}</span>
                    {risk ? (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                          risk.level === "high"
                            ? "bg-red-500/15 text-red-500"
                            : risk.level === "medium"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-emerald-500/15 text-emerald-600"
                        }`}
                      >
                        {t(`psy_risk_${risk.level}`)}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-border-custom/40 text-text-secondary text-[9px] font-black">
                        {t("psy_risk_none")}
                      </span>
                    )}
                    <span className="ms-auto flex items-center gap-2 shrink-0 text-[9px] font-bold text-text-secondary">
                      <span>{t("psy_caseload_notes", noteCount)}</span>
                      <span>{t("psy_caseload_moods", moodCount)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Risk flag editor for the selected student */}
          {adviceStudent && students.includes(adviceStudent) && (
            <div className="flex flex-col gap-2 pt-3 border-t border-border-custom">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
                {t("psy_risk_for", displayStudent(adviceStudent))}
              </span>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((level) => {
                  const current = studentRisks[adviceStudent];
                  const active = current?.level === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => {
                        setStudentRisk(adviceStudent, level, riskNote || current?.note || "");
                        setRiskNote("");
                      }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${
                        active
                          ? level === "high"
                            ? "bg-red-500 text-white border-red-500"
                            : level === "medium"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-emerald-500 text-white border-emerald-500"
                          : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
                      }`}
                    >
                      {t(`psy_risk_${level}`)}
                    </button>
                  );
                })}
              </div>
              <input
                value={riskNote}
                onChange={(e) => setRiskNote(e.target.value)}
                placeholder={t("psy_risk_note_placeholder")}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none text-text-primary font-semibold"
              />
            </div>
          )}
        </div>

        {/* Student Mood Logs */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <h3 className="font-black text-sm text-text-primary">{t("psy_recent_mood_logs")}</h3>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
            {caseloadMoodLogs.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">{t("psy_no_mood_logs")}</p>
            ) : caseloadMoodLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-2.5 rounded-2xl bg-border-custom/10 border border-border-custom/40">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{moodEmojis[log.mood] || "😊"}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-text-primary">{log.student}</span>
                    <span className="text-[9px] text-text-secondary font-bold">{t(log.mood)}</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-text-secondary">{new Date(log.at).toLocaleString()}</span>
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
                  {displayStudent(sName)}
                </button>
              ))}
            </div>
            <textarea value={newAdvice} onChange={(e) => setNewAdvice(e.target.value)}
              placeholder={adviceStudent ? t("psy_advice_placeholder", displayStudent(adviceStudent)) : t("psy_select_student_first")}
              rows={2} required
              className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold" />
            <button type="submit" disabled={!adviceStudent || students.length === 0}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-black shadow-xs hover:opacity-90 transition-all disabled:opacity-40">
              {t("psy_post_advice")}
            </button>
            {students.length === 0 && (
              <p className="text-[10px] text-text-secondary text-center">{t("psy_no_students")}</p>
            )}
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
                    {displayStudent(studentName)} ({notes.length})
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
            {helpConfirmVisible ? (
              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center flex flex-col gap-2">
                <p className="text-[11px] font-black text-green-600 dark:text-green-400">{t("psy_help_sent")}</p>
                <button
                  type="button"
                  onClick={() => setHelpConfirmVisible(false)}
                  className="text-[10px] font-black text-primary underline underline-offset-2"
                >
                  {t("psy_help_send_another")}
                </button>
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
