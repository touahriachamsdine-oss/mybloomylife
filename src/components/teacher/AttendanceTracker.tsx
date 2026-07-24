"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeft, Check, X, Clock, AlertTriangle, Calendar } from "lucide-react";
import type { UseTeacherData, AttendanceStatus } from "@/context/teacher";

interface Props {
  t: (k: string, ...a: (string | number)[]) => string;
  teacher: UseTeacherData;
  onNavigate: (screen: string) => void;
}

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  present: <Check size={12} />,
  absent: <X size={12} />,
  excused: <AlertTriangle size={12} />,
  late: <Clock size={12} />,
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500 text-white",
  absent: "bg-red-500 text-white",
  excused: "bg-amber-500 text-white",
  late: "bg-blue-500 text-white",
};

const NEXT_STATUS: Record<AttendanceStatus, AttendanceStatus> = {
  present: "absent",
  absent: "excused",
  excused: "late",
  late: "present",
};

export default function AttendanceTracker({ t, teacher, onNavigate }: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState(teacher.sections[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  const section = teacher.sections.find(s => s.id === selectedSectionId);
  const students = section?.studentNames || [];

  const todayRecords = teacher.getAttendanceForSection(selectedSectionId, selectedDate);

  const getStatus = (name: string): AttendanceStatus => {
    const rec = todayRecords.find(r => r.studentName === name);
    return rec?.status || "present";
  };

  const toggleStatus = (name: string) => {
    const current = getStatus(name);
    const next = NEXT_STATUS[current];
    teacher.markAttendance(
      students.map(s => ({ studentName: s, sectionId: selectedSectionId, status: s === name ? next : getStatus(s) })),
      selectedDate
    );
  };

  const markAll = (status: AttendanceStatus) => {
    teacher.markAttendance(
      students.map(s => ({ studentName: s, sectionId: selectedSectionId, status })),
      selectedDate
    );
  };

  const monthAttendance = useMemo(() => {
    const daysInMonth = new Date(selectedDate.slice(0, 7) + "-01").getMonth();
    const year = parseInt(selectedDate.slice(0, 4));
    const month = parseInt(selectedDate.slice(5, 7));
    const days = new Date(year, month, 0).getDate();
    const result: { day: number; stats: Record<AttendanceStatus, number> }[] = [];

    for (let d = 1; d <= days; d++) {
      const dateStr = `${selectedDate.slice(0, 7)}-${String(d).padStart(2, "0")}`;
      const records = teacher.attendance.filter(r => r.date === dateStr && r.sectionId === selectedSectionId);
      const stats = { present: 0, absent: 0, excused: 0, late: 0 };
      records.forEach(r => { stats[r.status]++; });
      result.push({ day: d, stats });
    }
    return result;
  }, [teacher.attendance, selectedSectionId, selectedDate]);

  const summary = useMemo(() => {
    const present = todayRecords.filter(r => r.status === "present").length;
    const absent = todayRecords.filter(r => r.status === "absent").length;
    const excused = todayRecords.filter(r => r.status === "excused").length;
    const late = todayRecords.filter(r => r.status === "late").length;
    const unmarked = students.length - todayRecords.length;
    return { present, absent, excused, late, unmarked };
  }, [todayRecords, students]);

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  return (
    <>
      <button onClick={() => onNavigate("back")} className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-2">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <h2 className="text-sm font-black text-text-primary">{t("teacher_attendance")}</h2>
        </div>

        <div className="flex gap-2 flex-wrap">
          {teacher.sections.map(s => (
            <button key={s.id} onClick={() => setSelectedSectionId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${selectedSectionId === s.id ? "bg-primary text-white border-primary" : "border-border-custom text-text-primary hover:bg-border-custom/20"}`}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="flex-1 p-2 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary" />
          <div className="flex rounded-xl overflow-hidden border border-border-custom">
            <button onClick={() => setViewMode("daily")} className={`px-3 py-1.5 text-[10px] font-bold ${viewMode === "daily" ? "bg-primary text-white" : "bg-surface text-text-primary"}`}>{t("teacher_daily")}</button>
            <button onClick={() => setViewMode("monthly")} className={`px-3 py-1.5 text-[10px] font-bold ${viewMode === "monthly" ? "bg-primary text-white" : "bg-surface text-text-primary"}`}>{t("teacher_monthly")}</button>
          </div>
        </div>
      </div>

      {viewMode === "daily" ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-green-600">{t("present")}</span>
              <span className="text-lg font-black text-green-600">{summary.present + summary.unmarked}</span>
            </div>
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-red-500">{t("absent")}</span>
              <span className="text-lg font-black text-red-500">{summary.absent}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-amber-600">{t("excused")}</span>
              <span className="text-lg font-black text-amber-600">{summary.excused}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-blue-600">{t("late")}</span>
              <span className="text-lg font-black text-blue-600">{summary.late}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button onClick={() => markAll("present")} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-[10px] font-bold hover:bg-green-600 transition-all">{t("teacher_mark_all_present")}</button>
            <button onClick={() => markAll("absent")} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-all">{t("teacher_mark_all_absent")}</button>
          </div>

          <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-secondary mb-1">{t("teacher_tap_to_toggle")}</span>
            {students.map(name => (
              <button key={name} onClick={() => toggleStatus(name)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-border-custom/20 transition-all">
                <span className="text-xs font-bold text-text-primary">{name}</span>
                <span className={`p-1.5 rounded-lg ${STATUS_COLORS[getStatus(name)]}`}>
                  {STATUS_ICONS[getStatus(name)]}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map(d => (
              <span key={d} className="text-[8px] font-bold text-text-secondary">{t(d).slice(0, 2)}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: new Date(parseInt(selectedDate.slice(0, 4)), parseInt(selectedDate.slice(5, 7)), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthAttendance.map(({ day, stats }) => {
              const total = stats.present + stats.absent + stats.excused + stats.late;
              const absences = stats.absent + stats.excused;
              const isToday = day === new Date().getDate() && selectedDate.slice(0, 7) === new Date().toISOString().slice(0, 7);
              return (
                <button key={day} onClick={() => { setSelectedDate(`${selectedDate.slice(0, 7)}-${String(day).padStart(2, "0")}`); setViewMode("daily"); }}
                  className={`p-1.5 rounded-lg text-[10px] font-bold border text-center ${isToday ? "border-primary bg-primary/5" : "border-border-custom"} ${absences > 0 ? "text-red-500" : "text-text-primary"}`}>
                  <div>{day}</div>
                  {total > 0 && <div className="text-[7px] text-text-secondary">{stats.present}/{total}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
