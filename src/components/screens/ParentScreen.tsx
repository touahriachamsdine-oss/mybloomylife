"use client";
import React, { useState, useEffect } from "react";
import { useBloom, ParentAlert, StudentGrades, getKidDailyLimitMs } from "@/context/BloomContext";
import { useTeacherData } from "@/context/teacher";
import { formatKidTime } from "@/lib/format";
import { createCredential, verifyPassword, StoredCredential } from "@/lib/auth";
import { bloomGetJson, bloomSetJson, BLOOM_KEYS } from "@/lib/storage";
import { Gamepad, Send, Lock, Unlock, Clock, AlertCircle, MessageSquare, Target, FileText, Trash2, Plus } from "lucide-react";

function ParentScreen({
  t,
  parentAuthenticated,
  setParentAuthenticated,
  parentAlerts,
  sendSupportMessage,
  kidRemainingMs
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  parentAuthenticated: boolean;
  setParentAuthenticated: (auth: boolean) => void;
  parentAlerts: ParentAlert[];
  sendSupportMessage: (to: string, msg: string) => void;
  kidRemainingMs: number;
}) {
  const teacherData = useTeacherData();
  const [parentView, setParentView] = useState<"overview" | "attendance" | "behavior" | "goals" | "messages" | "reports">("overview");
  const { studentGrades, linkChildAccount, linkedChildren, familyLinkCodes, studentLevels, currentUser, userPoints, gpaHistory, recordGpaSnapshot, goals, addGoal, deleteGoal, parentMessages, sendParentMessage, markMessageRead, guidanceNotes, moodLogs, studentAssignments } = useBloom();
  const parentEmail = currentUser?.email ?? "";
  // Children visible to this parent: admin-assigned ones + any linked by code.
  const assignedChildren = Object.entries(studentAssignments)
    .filter(([, a]) => (a.parents || []).includes(parentEmail))
    .map(([name]) => name);
  const children = Array.from(new Set([...assignedChildren, ...linkedChildren]));
  const storedPin = bloomGetJson<Record<string, StoredCredential>>(BLOOM_KEYS.parentPins, {})[parentEmail];
  const [pinMode, setPinMode] = useState<"enter" | "create">(storedPin ? "enter" : "create");
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [selectedChild, setSelectedChild] = useState<string>(() => {
    return children[0] || "Sara";
  });
  const [supportText, setSupportText] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [linkCode, setLinkCode] = useState<string>("");
  const [linkResult, setLinkResult] = useState<{ success: boolean; message: string } | null>(null);
  const [parentMsgText, setParentMsgText] = useState<string>("");
  const [showGoalForm, setShowGoalForm] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [goalTarget, setGoalTarget] = useState<number>(5);

  // Synchronize selectedChild with children updates
  useEffect(() => {
    if (children.length > 0 && !children.includes(selectedChild)) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  // Record a real GPA snapshot each time the overview shows a new average
  useEffect(() => {
    if (!parentAuthenticated || parentView !== "overview") return;
    recordGpaSnapshot(selectedChild);
  }, [parentAuthenticated, parentView, selectedChild, studentGrades, recordGpaSnapshot]);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = linkChildAccount(linkCode);
    if (result.success) {
      setLinkResult({ success: true, message: t("parent_link_success", result.childName ?? "") });
      setLinkCode("");
    } else {
      setLinkResult({ success: false, message: t("parent_link_not_found") });
    }
    setTimeout(() => setLinkResult(null), 4000);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    const pins = bloomGetJson<Record<string, StoredCredential>>(BLOOM_KEYS.parentPins, {});
    if (pinMode === "create") {
      const cred = await createCredential(pin);
      pins[parentEmail] = cred;
      bloomSetJson(BLOOM_KEYS.parentPins, pins);
      setParentAuthenticated(true);
      return;
    }
    const stored = pins[parentEmail];
    const ok = stored ? await verifyPassword(pin, stored) : false;
    if (ok) {
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

  // Parent -> school message (item: communicate with teachers/psychologist)
  const handleSendParentMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentMsgText.trim()) return;
    sendParentMessage({ from: "parent", studentName: selectedChild, content: parentMsgText.trim(), read: false });
    setParentMsgText("");
  };

  // Shared goals (item: participate in setting goals with the child)
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    addGoal(goalTitle.trim(), goalTarget, selectedChild);
    setGoalTitle("");
    setGoalTarget(5);
    setShowGoalForm(false);
  };

  // Encouragement (item: encourage the child toward their goals)
  const handleEncourage = (goalTitleKey: string) => {
    sendSupportMessage(selectedChild, t("parent_encourage_goal", t(goalTitleKey)));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
  
  // Real GPA trend snapshots recorded as the child's grades change
  const history = gpaHistory[selectedChild] && gpaHistory[selectedChild].length > 0 ? gpaHistory[selectedChild] : [gpa];
  // Real psychologist guidance notes for this child
  const notes = guidanceNotes[selectedChild] || [];

  // Shared goals + school messages + well-being signals for the selected child
  const childGoals = goals.filter(g => g.studentName === selectedChild);
  const childMessages = parentMessages
    .filter(m => m.studentName === selectedChild)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const moodEmojis: Record<string, string> = {
    mood_happy: "😊",
    mood_sad: "😢",
    mood_anxious: "😰",
    mood_angry: "😡",
    mood_calm: "😌"
  };
  const childMoodCounts = Object.entries(
    moodLogs
      .filter(m => m.student === selectedChild)
      .reduce<Record<string, number>>((acc, log) => {
        acc[log.mood] = (acc[log.mood] || 0) + 1;
        return acc;
      }, {})
  ).map(([mood, count]) => ({ mood, count }));
  const childMoodTotal = childMoodCounts.reduce((acc, c) => acc + c.count, 0);

  const activeChildInfo = {
    gpa,
    progress,
    level: activeStudentLevel?.year || 12,
    points: userPoints,
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
          <h2 className="font-black text-base text-text-primary">{t(pinMode === "create" ? "parent_pin_create_title" : "parent_pin_title")}</h2>
          <p className="text-[11px] text-text-secondary mt-1 max-w-[80%] mx-auto">
            {t(pinMode === "create" ? "parent_pin_create_subtitle" : "parent_pin_subtitle")}
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
            {t("parent_clear")}
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
            {t("parent_delete")}
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
          <p className="text-[9px] text-text-secondary">{t("parent_dashboard")}</p>
        </div>
        <button
          onClick={() => setParentAuthenticated(false)}
          className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:underline p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20"
        >
          <Unlock size={12} /> {t("parent_lock_portal")}
        </button>
      </div>

      {/* Student screens play-time info (30 min weekdays / 1 hour weekends) */}
      <div className="p-4 rounded-3xl bg-primary/10 border border-primary/30 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-white p-2 rounded-xl shrink-0">
            <Gamepad size={16} />
          </span>
          <div>
            <h3 className="font-black text-sm text-text-primary">{t("kid_mode_title")}</h3>
            <p className="text-[9px] text-text-secondary">{t("kid_mode_subtitle_sidebar")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border-custom/40">
          <Clock size={14} className="text-primary animate-pulse" />
          <span className="text-xs font-black text-primary">
            {getKidDailyLimitMs() > 30 * 60 * 1000 ? t("kid_mode_hour") : t("kid_mode_minutes")} · {formatKidTime(kidRemainingMs)}
          </span>
        </div>
      </div>

      {/* Link Child Account Card */}
      <div className="p-4 rounded-3xl bg-surface border border-primary/20 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔗</span>
          <div>
            <h3 className="text-xs font-black text-text-primary">{t("parent_link_title")}</h3>
            <p className="text-[9px] text-text-secondary">{t("parent_link_subtitle")}</p>
          </div>
        </div>

        {/* Already linked children */}
        {children.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{t("parent_linked_children")}</span>
            {children.map((childName) => {
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
                        <span className="text-[9px] text-text-secondary italic">{t("level_not_set")}</span>
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
            placeholder={t("parent_link_code_placeholder")}
            maxLength={7}
            className="flex-1 px-3 py-2 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-primary/20 outline-none tracking-widest uppercase"
            required
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white font-black text-xs rounded-xl hover:opacity-90 transition-all shrink-0">
            {t("parent_link_btn")}
          </button>
        </form>

        {linkResult && (
          <p className={`text-[10px] font-bold px-1 ${linkResult.success ? "text-emerald-600" : "text-red-500"}`}>
            {linkResult.message}
          </p>
        )}
      </div>

      {/* Child Switcher Tabs */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((cName) => {
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

      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ["overview", "parent_overview"],
          ["attendance", "parent_attendance"],
          ["behavior", "parent_behavior"],
          ["goals", "parent_goals_title"],
          ["messages", "parent_messages_title"],
          ["reports", "parent_reports_title"]
        ] as const).map(([view, key]) => (
          <button key={view} onClick={() => setParentView(view)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${parentView === view ? "bg-primary text-white border-primary" : "bg-surface text-text-primary border-border-custom hover:bg-border-custom/20"}`}>
            {t(key)}
          </button>
        ))}
      </div>

      {parentView === "attendance" ? (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
          <h3 className="font-black text-sm text-text-primary">{t("parent_attendance")}</h3>
          {(() => {
            const records = teacherData.attendance.filter(r => r.studentName === selectedChild);
            if (records.length === 0) return <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>;
            return records.slice(-20).reverse().map(r => (
              <div key={`${r.date}-${r.status}`} className="flex items-center justify-between text-xs py-1">
                <span className="font-bold text-text-primary">{r.date}</span>
                <span className={`font-black ${r.status === "present" ? "text-green-600" : r.status === "absent" ? "text-red-500" : r.status === "excused" ? "text-amber-600" : "text-blue-600"}`}>{t(r.status)}</span>
              </div>
            ));
          })()}
        </div>
      ) : parentView === "behavior" ? (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
          <h3 className="font-black text-sm text-text-primary">{t("parent_behavior")}</h3>
          {(() => {
            const notes = teacherData.behaviorNotes.filter(n => n.studentName === selectedChild);
            if (notes.length === 0) return <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>;
            return notes.map(n => (
              <div key={n.id} className={`p-2 rounded-xl border text-xs ${n.type === "positive" ? "bg-green-500/5 border-green-500/20" : n.type === "negative" ? "bg-red-500/5 border-red-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`font-black ${n.type === "positive" ? "text-green-600" : n.type === "negative" ? "text-red-500" : "text-blue-600"}`}>{t(n.type)}</span>
                  <span className="text-text-secondary text-[9px]">{n.date}</span>
                </div>
                <p className="text-text-primary font-medium mt-0.5">{n.note}</p>
              </div>
            ));
          })()}
        </div>
      ) : parentView === "goals" ? (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary p-2 rounded-xl"><Target size={16} /></span>
              <div>
                <h3 className="font-black text-sm text-text-primary">{t("parent_goals_title")}</h3>
                <p className="text-[9px] text-text-secondary">{t("parent_goals_subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowGoalForm(true)}
              className="flex items-center gap-1 bg-primary text-white py-2 px-3 rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
            >
              <Plus size={13} /> {t("parent_goals_add")}
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleAddGoal} className="flex flex-col gap-2 p-3 rounded-2xl bg-border-custom/10 border border-border-custom">
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder={t("goals_title_placeholder")}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none text-text-primary"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(parseInt(e.target.value, 10) || 1)}
                  className="w-24 p-2.5 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none text-text-primary"
                  required
                />
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black">{t("goals_add_btn")}</button>
                <button type="button" onClick={() => setShowGoalForm(false)} className="px-4 py-2.5 bg-border-custom text-text-primary rounded-xl text-xs font-bold">{t("goals_cancel_btn")}</button>
              </div>
            </form>
          )}

          {childGoals.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">{t("parent_goals_empty")}</p>
          ) : childGoals.map((goal) => {
            const isCompleted = goal.currentProgress >= goal.targetProgress;
            return (
              <div key={goal.id} className={`p-3 rounded-2xl border flex flex-col gap-2 ${isCompleted ? "border-green-500/30" : "border-border-custom"}`}>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-black text-xs text-text-primary truncate">{t(goal.title)}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEncourage(goal.title)}
                      className="px-2.5 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all"
                    >
                      {t("parent_encourage_btn")}
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 hover:scale-105 active:scale-95 transition-all"
                      aria-label={t("goals_delete_label")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-border-custom/50 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`} style={{ width: `${Math.min(100, (goal.currentProgress / goal.targetProgress) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-text-primary shrink-0">{goal.currentProgress} / {goal.targetProgress}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : parentView === "messages" ? (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-2 rounded-xl"><MessageSquare size={16} /></span>
            <div>
              <h3 className="font-black text-sm text-text-primary">{t("parent_messages_title")}</h3>
              <p className="text-[9px] text-text-secondary">{t("parent_messages_subtitle")}</p>
            </div>
          </div>

          {childMessages.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">{t("parent_messages_empty")}</p>
          ) : childMessages.map((m) => (
            <div key={m.id} className={`p-3 rounded-2xl border text-xs flex flex-col gap-1 ${m.from === "teacher" ? "bg-primary/5 border-primary/20" : "bg-border-custom/10 border-border-custom"}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="font-black text-text-primary">{m.from === "teacher" ? t("sender_school") : t("parent_title")}</span>
                <span className="text-[9px] text-text-secondary">{new Date(m.date).toLocaleString()}</span>
              </div>
              <p className="text-text-primary leading-relaxed">{m.content}</p>
              {m.from === "teacher" && !m.read && (
                <button onClick={() => markMessageRead(m.id)} className="self-end text-[9px] font-black text-primary underline">{t("teacher_mark_read")}</button>
              )}
            </div>
          ))}

          <form onSubmit={handleSendParentMessage} className="flex flex-col gap-2 pt-1">
            <textarea
              value={parentMsgText}
              onChange={(e) => setParentMsgText(e.target.value)}
              placeholder={t("parent_messages_placeholder")}
              rows={2}
              className="w-full p-3 rounded-2xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold"
              required
            />
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5">
              <Send size={14} /> {t("parent_messages_send")}
            </button>
          </form>
        </div>
      ) : parentView === "reports" ? (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-2 rounded-xl"><FileText size={16} /></span>
            <div>
              <h3 className="font-black text-sm text-text-primary">{t("parent_reports_title")}</h3>
              <p className="text-[9px] text-text-secondary">{t("parent_reports_subtitle")}</p>
            </div>
          </div>

          {/* Educational report */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_educational_report")}</span>
            <div className="flex flex-col gap-1.5">
              {Object.keys(studentGrades[selectedChild] || {}).length === 0 ? (
                <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>
              ) : Object.entries(studentGrades[selectedChild]).map(([subject, grade]) => (
                <div key={subject} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-text-primary flex-1 truncate">{t(subject)}</span>
                  <div className="flex-1 bg-border-custom/50 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(grade / 20) * 100}%`, background: grade >= 10 ? "var(--color-primary)" : "#ef4444" }} />
                  </div>
                  <span className={`font-black w-9 text-right ${grade >= 10 ? "text-emerald-500" : "text-red-500"}`}>{grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychological well-being */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_mood_trend")}</span>
            {childMoodTotal === 0 ? (
              <p className="text-xs text-text-secondary">{t("parent_no_mood_data")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {childMoodCounts.map(({ mood, count }) => (
                  <div key={mood} className="flex items-center gap-1 text-[10px] bg-border-custom/10 rounded-lg px-2 py-1 border border-border-custom/50">
                    <span>{moodEmojis[mood] || "😊"}</span>
                    <span className="font-bold text-text-primary">{count}</span>
                    <span className="text-text-secondary">({Math.round((count / childMoodTotal) * 100)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Psychologist advice */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_psych_advice")}</span>
            {notes.length === 0 ? (
              <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {notes.map((note, index) => (
                  <p key={index} className="text-xs text-text-primary leading-relaxed pl-2 border-l-2 border-primary/40 font-semibold">• {note}</p>
                ))}
              </div>
            )}
          </div>
          {/* Educational recommendations / tips */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_edu_tips")}</span>
            <div className="flex flex-col gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <p key={n} className="text-xs text-text-primary leading-relaxed pl-2 border-l-2 border-amber-400/40 font-semibold">
                  • {t(`parent_tip_${n}`)}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
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
              <span className="text-[10px] text-text-secondary font-semibold">{t("parent_gpa")}</span>
              <span className="text-xs font-black text-emerald-500">{activeChildInfo.gpa}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-secondary font-semibold">{t("parent_points")}</span>
              <span className="text-xs font-black" style={{ color: 'var(--accent-orange)' }}>{activeChildInfo.points}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-secondary font-semibold">{t("parent_child_progress")}</span>
              <span className="text-xs font-black text-primary">{activeChildInfo.progress}%</span>
            </div>
          </div>
        </div>

        {/* Academic GPA history chart SVG */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_gpa_trend")}</span>
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

        {/* Psychologist advice notes */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("parent_psych_advice")}</span>
          {activeChildInfo.notes.length === 0 ? (
            <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {activeChildInfo.notes.map((note, index) => (
                <p key={index} className="text-xs text-text-primary leading-relaxed pl-2 border-l-2 border-primary/40 font-semibold">
                  • {note}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Parental Interactive Messages panel */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-sm text-text-primary">{t("parent_send_support_title")}</h3>
        <p className="text-[11px] text-text-secondary">{t("parent_support_hint")}</p>

        {showToast && (
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center text-[10px] font-black text-green-700 dark:text-green-400">
            {t("parent_support_toast")}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <textarea
            value={supportText}
            onChange={(e) => setSupportText(e.target.value)}
            placeholder={t("parent_support_placeholder", t(`parent_child_${selectedChild.toLowerCase()}`))}
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
          {parentAlerts.length === 0 ? (
            <p className="text-xs text-text-secondary">{t("parent_no_data")}</p>
          ) : parentAlerts.map((alert) => {
            let label = "";
            let color = "bg-primary/10 text-primary border-primary/20";
            if (alert.type === "low_grade") {
              label = t("parent_alert_low_grade", t(alert.childName), alert.timeValue);
              color = "bg-red-100 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400";
            } else if (alert.type === "goal_completed") {
              label = t("parent_alert_goal_completed", t(alert.childName));
              color = "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400";
            } else if (alert.type === "fatigue") {
              label = t("parent_alert_fatigue");
              color = "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400";
            } else if (alert.type === "help_request") {
              label = t("parent_alert_help_request", t(alert.childName));
              color = "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400";
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

export default ParentScreen;
