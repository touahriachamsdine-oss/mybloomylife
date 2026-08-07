"use client";
import { useState } from "react";
import { useBloom, StudentGrades } from "@/context/BloomContext";

function AcademicScreen({ t }: { t: (k: string, ...a: (string | number)[]) => string }) {
  const { studentGrades, updateGrade, userRole, currentUser } = useBloom();
  const students = Object.keys(studentGrades);
  const [teacherSelectedStudent, setTeacherSelectedStudent] = useState<string>("Sara");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Identify who we are inspecting
  const currentStudent = userRole === "admin" ? (teacherSelectedStudent || students[0] || "Sara") : (userRole === "youth" ? (currentUser?.name || "Sara") : "Sara");
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

  // If admin, render Grade Book Dashboard
  if (userRole === "admin") {
    return (
      <>
        {/* Admin Selection Card */}
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
          <div>
            <h2 className="text-xs font-black text-primary uppercase tracking-wider">{t("aca_teacher_grade_book")}</h2>
            <p className="text-[10px] text-text-secondary">{t("aca_teacher_select_hint")}</p>
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
            <span className="text-xs font-black text-text-primary">{t("aca_subject_grades")}</span>
            <span className="text-xs font-black text-primary font-bold">{t("aca_class_average", currentGPA)}</span>
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
        <h3 className="font-black text-sm text-text-primary">{t("aca_trimester_trend")}</h3>
        <p className="text-[10px] text-text-secondary">{t("aca_hover_hint")}</p>

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
                      {t("aca_avg_tooltip", p.gpa)}
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
                  {t("aca_trim_label", p.num)}
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

export default AcademicScreen;
