"use client";
import React, { useState, useEffect } from "react";
import { useBloom, AppLanguage, AlgerianCycle, StudentGrades } from "@/context/BloomContext";
import { TrendingUp, Gamepad, Heart, Plus, Check, X, Award, Sparkles, Shield, ChevronRight, Activity, Users } from "lucide-react";

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
    registeredUsers,
    deleteRegisteredUser,
    studentAssignments,
    assignStudentRoles
  } = useBloom();

  // Admin sub-tab state
  const [activeTab, setActiveTab] = useState<"levels" | "games" | "students" | "users">("students");

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

  const students = Object.keys(studentGrades);

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
    primaire: t("admin_cycle_primaire_opt"),
    moyen: t("admin_cycle_moyen_opt"),
    lycee: t("admin_cycle_lycee_opt")
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
    setLevelsMsg(t("admin_year_added"));
    setTimeout(() => setLevelsMsg(null), 3000);
  };

  const handleAddTrack = () => {
    if (!newTrackName.trim()) return;
    addCustomTrack(trackCycle, trackYear, newTrackName.trim());
    setNewTrackName("");
    setLevelsMsg(t("admin_track_added"));
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
    if (!gameTitle.trim()) { setGameMsg(t("admin_game_title_required")); return; }
    if (gameType === "quiz") {
      const validQ = quizQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
      if (validQ.length === 0) { setGameMsg(t("admin_game_question_required")); return; }
      addCustomGame({ title: gameTitle, description: gameDesc, cycle: gameCycle, type: "quiz", questions: validQ });
    } else {
      const emojiList = memEmojis.split(",").map(e => e.trim()).filter(Boolean);
      if (emojiList.length < 3) { setGameMsg(t("admin_game_emojis_required")); return; }
      addCustomGame({ title: gameTitle, description: gameDesc, cycle: gameCycle, type: "memory", emojis: emojiList });
    }
    setGameTitle(""); setGameDesc(""); setMemEmojis("🐶,🐱,🦊,🐻,🦁,🐯");
    setQuizQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    setGameMsg(t("admin_game_created"));
    setTimeout(() => setGameMsg(null), 4000);
  };

  // ── User management state ──
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Grade update handler ──
  const handleGradeUpdate = (subject: string) => {
    const val = parseFloat(editGrade[subject] || "");
    if (isNaN(val) || val < 0 || val > 20) { setGradeMsg(t("admin_grade_range")); return; }
    updateGrade(selectedStudent, subject, val);
    setEditGrade(prev => { const n = { ...prev }; delete n[subject]; return n; });
    setGradeMsg(t("admin_grade_updated"));
    setTimeout(() => setGradeMsg(null), 2500);
  };

  const studentGrade = studentGrades[selectedStudent];
  const studentLevel = studentLevels[selectedStudent];
  const studentMoods = moodLogs.filter(l => l.student === selectedStudent);

  // ── Access control (assigned parents & psychologists) ──
  const currentAssignments = studentAssignments[selectedStudent] || { parents: [], psychologists: [] };
  const parentUsers = registeredUsers.filter(u => u.role === "parent");
  const psyUsers = registeredUsers.filter(u => u.role === "psychologist");
  const toggleAssignment = (role: "parent" | "psychologist", email: string) => {
    const cur = studentAssignments[selectedStudent] || { parents: [], psychologists: [] };
    const arr = role === "parent" ? cur.parents : cur.psychologists;
    const list = arr.includes(email) ? arr.filter(e => e !== email) : [...arr, email];
    assignStudentRoles(selectedStudent, {
      parents: role === "parent" ? list : cur.parents,
      psychologists: role === "psychologist" ? list : cur.psychologists
    });
  };
  const renderAssignList = (users: { email: string; name: string; role: string }[], role: "parent" | "psychologist") => {
    const active = role === "parent" ? currentAssignments.parents : currentAssignments.psychologists;
    return (
      <div className="flex flex-col gap-1">
        {users.length === 0 ? (
          <p className="text-[10px] text-text-secondary italic py-2">{t("admin_access_none")}</p>
        ) : (
          users.map(u => {
            const on = active.includes(u.email);
            return (
              <button
                key={u.email}
                onClick={() => toggleAssignment(role, u.email)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                  on ? "bg-primary/10 border-primary/30" : "bg-border-custom/10 border-border-custom/40 hover:bg-border-custom/20"
                }`}
              >
                <span className="flex flex-col">
                  <span className={`text-xs font-black ${on ? "text-primary" : "text-text-primary"}`}>{u.name}</span>
                  <span className="text-[9px] text-text-secondary font-bold">{u.email}</span>
                </span>
                <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${on ? "bg-primary text-white" : "bg-border-custom/50 text-text-secondary"}`}>
                  {on ? <Check size={9} /> : <Plus size={9} />}
                </span>
              </button>
            );
          })
        )}
      </div>
    );
  };

  const tabBtn = (id: "levels" | "games" | "students" | "users", label: string, icon: React.ReactNode) => (
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
          <h2 className="font-black text-sm text-text-primary">{t("admin_title")}</h2>
          <p className="text-[11px] text-text-secondary">{t("admin_subtitle")}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-border-custom/20 rounded-2xl">
        {tabBtn("students", t("teacher_student_list"), <Activity size={14} />)}
        {tabBtn("games", t("games_title"), <Gamepad size={14} />)}
        {tabBtn("levels", t("admin_tab_levels"), <TrendingUp size={14} />)}
        {tabBtn("users", t("admin_tab_users"), <Users size={14} />)}
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
                  {t("admin_no_level_set")}
                </span>
              )}
            </div>

            {studentLevel && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">{t("admin_cycle")}</div>
                  <div className="text-xs font-black text-text-primary capitalize">{studentLevel.cycle}</div>
                </div>
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">{t("admin_year")}</div>
                  <div className="text-xs font-black text-text-primary">{t("admin_year_suffix", studentLevel.year)}</div>
                </div>
                <div className="p-2 rounded-xl bg-border-custom/20">
                  <div className="text-[10px] text-text-secondary font-bold">{t("admin_track")}</div>
                  <div className="text-[9px] font-black text-text-primary truncate">{studentLevel.track || "—"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Access Control: who may see this student's data */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
                <Users size={14} className="text-primary" />
                {t("admin_access_title")}
              </h3>
              <span className="text-[9px] font-black text-text-secondary">{selectedStudent}</span>
            </div>
            <div>
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-wide mb-1.5">{t("admin_access_parents")}</div>
              {renderAssignList(parentUsers, "parent")}
            </div>
            <div>
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-wide mb-1.5">{t("admin_access_psychologists")}</div>
              {renderAssignList(psyUsers, "psychologist")}
            </div>
          </div>

          {/* Mood History */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <Heart size={14} className="text-red-400" />
              {t("admin_emotional_wellbeing")}
            </h3>
            {studentMoods.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-3">{t("admin_no_mood_logs")}</p>
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
              {t("admin_academic_grades")}
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
              <h3 className="font-black text-sm text-text-primary">{t("admin_created_games", customGames.length)}</h3>
              <div className="flex flex-col gap-2">
                {customGames.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-border-custom/20">
                    <div>
                      <div className="text-xs font-black text-text-primary">{g.title}</div>
                      <div className="text-[10px] text-text-secondary">{CYCLE_LABELS[g.cycle]} · {g.type === "quiz" ? t("admin_questions_count", g.questions?.length || 0) : t("admin_emojis_count", g.emojis?.length || 0)}</div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${g.type === "quiz" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"}`}>
                      {g.type === "quiz" ? t("game_quiz_title") : t("admin_game_type_memory")}
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
              {t("admin_create_game")}
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
              <label className={labelCls}>{t("admin_game_title")}</label>
              <input value={gameTitle} onChange={e => setGameTitle(e.target.value)} placeholder={t("admin_game_title_placeholder")} className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_description")}</label>
              <input value={gameDesc} onChange={e => setGameDesc(e.target.value)} placeholder={t("admin_game_desc_placeholder")} className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_target_cycle")}</label>
              <select value={gameCycle} onChange={e => setGameCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">{t("admin_cycle_primaire")}</option>
                <option value="moyen">{t("admin_cycle_moyen")}</option>
                <option value="lycee">{t("admin_cycle_lycee")}</option>
              </select>
            </div>

            {/* Quiz specific */}
            {gameType === "quiz" && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>{t("admin_questions")}</label>
                  <button onClick={handleAddQuestion} className="text-[10px] font-black text-primary flex items-center gap-1 hover:underline">
                    <Plus size={11} /> {t("admin_add_question")}
                  </button>
                </div>
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-border-custom/20 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-text-secondary">{t("admin_q_label", idx + 1)}</span>
                      {quizQuestions.length > 1 && (
                        <button onClick={() => handleRemoveQuestion(idx)} className="text-red-400 hover:text-red-600">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <input
                      value={q.question}
                      onChange={e => handleQuestionChange(idx, "question", e.target.value)}
                      placeholder={t("admin_question_placeholder")}
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
                            placeholder={t("admin_option_label", oi + 1)}
                            className="flex-1 p-1.5 rounded-lg border border-border-custom bg-surface text-[10px] text-text-primary outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-text-secondary">{t("admin_radio_hint")}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Memory specific */}
            {gameType === "memory" && (
              <div className="flex flex-col gap-2">
                <label className={labelCls}>{t("admin_emojis_label")}</label>
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
                <p className="text-[9px] text-text-secondary">{t("admin_memory_hint")}</p>
              </div>
            )}

            <button
              onClick={handleCreateGame}
              className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              {t("admin_publish_game")}
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
              {t("admin_levels_structure")}
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
              {t("admin_add_year")}
            </h3>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_cycle")}</label>
              <select value={levelCycle} onChange={e => setLevelCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">{t("admin_cycle_primaire_opt")}</option>
                <option value="moyen">{t("admin_cycle_moyen_opt")}</option>
                <option value="lycee">{t("admin_cycle_lycee_opt")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_year_label")}</label>
              <input value={newYearLabel} onChange={e => setNewYearLabel(e.target.value)} placeholder={t("admin_year_label_placeholder")} className={inputCls} />
            </div>
            <button onClick={handleAddYear} className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black transition-all hover:bg-primary/95">
              {t("admin_add_year_btn")}
            </button>
          </div>

          {/* Add Track form */}
          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
              <ChevronRight size={14} className="text-primary" />
              {t("admin_add_track")}
            </h3>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_cycle")}</label>
              <select value={trackCycle} onChange={e => setTrackCycle(e.target.value as AlgerianCycle)} className={inputCls}>
                <option value="primaire">{t("admin_cycle_primaire_opt")}</option>
                <option value="moyen">{t("admin_cycle_moyen_opt")}</option>
                <option value="lycee">{t("admin_cycle_lycee_opt")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_year_number")}</label>
              <input
                type="number"
                min="1"
                value={trackYear}
                onChange={e => setTrackYear(parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t("admin_track_name")}</label>
              <input value={newTrackName} onChange={e => setNewTrackName(e.target.value)} placeholder={t("admin_track_name_placeholder")} className={inputCls} />
            </div>
            <button onClick={handleAddTrack} className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black transition-all hover:bg-primary/95">
              {t("admin_add_track_btn")}
            </button>
          </div>
        </>
      )}

      {/* ── Tab: Users ── */}
      {activeTab === "users" && (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h3 className="font-black text-sm text-text-primary">{t("admin_users")}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {registeredUsers.map(u => (
              <div key={u.email} className="flex items-center justify-between p-2.5 rounded-xl bg-border-custom/10 border border-border-custom/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-primary">{u.name}</span>
                    <span className="text-[9px] text-text-secondary">{u.email} · {t("role_" + u.role)}</span>
                  </div>
                </div>
                {u.email !== "admin@example.com" && (
                  <div className="flex items-center gap-2">
                    {deleteConfirm === u.email ? (
                      <>
                        <button onClick={() => {
                          deleteRegisteredUser(u.email);
                          setDeleteConfirm(null);
                        }} className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">{t("admin_confirm_delete")}</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[9px] font-bold text-text-secondary bg-border-custom/50 px-2 py-1 rounded-lg">{t("back")}</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(u.email)}
                        className="text-[9px] font-bold text-red-400 hover:text-red-600 bg-red-500/5 px-2 py-1 rounded-lg">{t("admin_delete_user")}</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


export default AdminDashboardScreen;
