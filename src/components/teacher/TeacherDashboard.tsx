"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, AlertCircle, BarChart3, ArrowLeft } from "lucide-react";
import type { UseTeacherData } from "@/context/teacher";
import { useBloom } from "@/context/BloomContext";

interface Props {
  t: (k: string, ...a: (string | number)[]) => string;
  teacher: UseTeacherData;
  onNavigate: (screen: string) => void;
}

export default function TeacherDashboard({ t, teacher, onNavigate }: Props) {
  const { studentGrades, registeredUsers, moodLogs } = useBloom();
  const [selectedSectionId, setSelectedSectionId] = useState(teacher.sections[0]?.id || "");

  const section = teacher.sections.find(s => s.id === selectedSectionId);
  const students = section?.studentNames || [];

  const classGrades = useMemo(() => {
    const subs = new Set<string>();
    // avg is number | null: null means "no marks recorded for this student".
    //
    // It used to default to 0, which was not a neutral placeholder. A student
    // with no grades scored 0, counted as failed (0 < 10), and pulled the
    // class average down - so an ungraded roster looked like a failing class,
    // and the pass/fail split added every ungraded student to the failures.
    const rows: { name: string; grades: Record<string, number>; avg: number | null; graded: boolean }[] = [];

    students.forEach(name => {
      const gs = studentGrades[name] || {};
      const vals = Object.values(gs);
      const avg = vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
      Object.keys(gs).forEach(k => subs.add(k));
      rows.push({ name, grades: gs, avg, graded: avg !== null });
    });

    const subjectList = Array.from(subs);
    const subjectAvgs = subjectList.map(sub => {
      const vals = rows.map(r => r.grades[sub]).filter(v => v !== undefined);
      return { subject: sub, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, count: vals.length };
    });

    // Averaged over graded students only. Including ungraded ones as 0 was the
    // other half of the same defect.
    const gradedRows = rows.filter(r => r.avg !== null);
    const classAvg = gradedRows.length > 0
      ? gradedRows.reduce((s, r) => s + (r.avg as number), 0) / gradedRows.length
      : null;
    const passed = rows.filter(r => r.avg !== null && (r.avg as number) >= 10).length;
    const failed = rows.filter(r => r.avg !== null && (r.avg as number) < 10).length;
    const ungraded = rows.length - gradedRows.length;

    return { classAvg, passed, failed, ungraded, rows, subjectAvgs };
  }, [students, studentGrades]);

  const recentMoods = useMemo(() => {
    // New logs are prepended, so the most recent are at the front. slice(-10)
    // was returning the ten oldest entries, the opposite of "recent".
    return moodLogs
      .filter(m => students.includes(m.student))
      .slice()
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 10);
  }, [moodLogs, students]);

  return (
    <>
      <button onClick={() => onNavigate("back")} className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-2">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <h2 className="text-sm font-black text-text-primary">{t("teacher_dashboard")}</h2>
        </div>

        <div className="flex gap-2 flex-wrap">
          {teacher.sections.map(s => (
            <button key={s.id} onClick={() => setSelectedSectionId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${selectedSectionId === s.id ? "bg-primary text-white border-primary" : "border-border-custom text-text-primary hover:bg-border-custom/20"}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {section && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex flex-col items-center">
              <span className="text-[9px] font-bold text-text-secondary uppercase">{t("teacher_avg")}</span>
              <span className="text-xl font-black text-primary">
                {classGrades.classAvg === null ? "--" : classGrades.classAvg.toFixed(1)}
              </span>
              <span className="text-[8px] text-text-secondary">/20</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex flex-col items-center">
              <span className="text-[9px] font-bold text-text-secondary uppercase">{t("teacher_passed")}</span>
              <span className="text-xl font-black text-green-600">{classGrades.passed}</span>
              <span className="text-[8px] text-text-secondary">/ {students.length - classGrades.ungraded}</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex flex-col items-center">
              <span className="text-[9px] font-bold text-text-secondary uppercase">{t("teacher_failed")}</span>
              <span className="text-xl font-black text-red-500">{classGrades.failed}</span>
              <span className="text-[8px] text-text-secondary">/ {students.length - classGrades.ungraded}</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><BookOpen size={14} /> {t("teacher_subject_breakdown")}</span>
            {classGrades.subjectAvgs.map(sa => (
              <div key={sa.subject} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-primary w-24 truncate">{t(sa.subject)}</span>
                <div className="flex-1 bg-border-custom/50 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(sa.avg / 20) * 100}%`, background: sa.avg >= 10 ? "var(--color-primary)" : "#ef4444" }} />
                </div>
                <span className="text-[10px] font-black text-text-primary w-10 text-right">{sa.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><Users size={14} /> {t("teacher_student_list")}</span>
            {students.map(name => {
              const row = classGrades.rows.find(r => r.name === name);
              const avg = row?.avg ?? null;
              return (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{name}</span>
                  {/* An ungraded student is neutral, not failing. The old
                      ternary painted every null/0 average red. */}
                  <span className={`font-black ${avg === null ? "text-text-secondary" : avg >= 10 ? "text-green-600" : "text-red-500"}`}>
                    {avg === null ? "—" : avg.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {recentMoods.length > 0 && (
            <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5"><AlertCircle size={14} /> {t("teacher_recent_moods")}</span>
              {recentMoods.slice(0, 5).map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="font-bold text-text-primary">{m.student}</span>
                  <span className="text-text-secondary">{t(m.mood)}</span>
                  <span className="text-text-secondary ml-auto">{new Date(m.at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onNavigate("attendance")} className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex items-center gap-2 hover:bg-border-custom/10 transition-all">
              <Users size={16} className="text-primary" />
              <span className="text-xs font-bold text-text-primary">{t("teacher_attendance")}</span>
            </button>
            <button onClick={() => onNavigate("behavior")} className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex items-center gap-2 hover:bg-border-custom/10 transition-all">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-text-primary">{t("teacher_behavior")}</span>
            </button>
            <button onClick={() => onNavigate("schedule")} className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex items-center gap-2 hover:bg-border-custom/10 transition-all">
              <TrendingUp size={16} className="text-blue-500" />
              <span className="text-xs font-bold text-text-primary">{t("teacher_schedule")}</span>
            </button>
            <button onClick={() => onNavigate("messages")} className="p-3 rounded-2xl bg-surface border border-border-custom shadow-xs flex items-center gap-2 hover:bg-border-custom/10 transition-all">
              <BookOpen size={16} className="text-purple-500" />
              <span className="text-xs font-bold text-text-primary">{t("teacher_messages")}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
