"use client";

import { useState, useCallback, useEffect } from "react";
import { AlgerianCycle } from "./BloomContext";

// ---- Data Types ----

export interface ClassSection {
  id: string;
  name: string;
  cycle: AlgerianCycle;
  year: number;
  track?: string;
  studentNames: string[];
}

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  sectionId: string;
  studentName: string;
  status: AttendanceStatus;
}

export interface BehaviorNote {
  id: string;
  date: string;
  studentName: string;
  type: "positive" | "negative" | "general";
  note: string;
  teacherName: string;
}

export interface ScheduleEntry {
  id: string;
  day: number; // 0=Sunday .. 4=Thursday
  startTime: string; // "08:00"
  endTime: string;
  subject: string;
  sectionId: string;
  room?: string;
}

export interface ParentMessage {
  id: string;
  date: string;
  from: "teacher" | "parent";
  teacherName?: string;
  parentName?: string;
  studentName: string;
  content: string;
  read: boolean;
}

// ---- Default sections based on Algerian cycles ----
const DEFAULT_SECTIONS: ClassSection[] = [
  { id: "1am_a", name: "1AM A", cycle: "moyen", year: 1, studentNames: ["Sara", "Ahmed", "Lina", "Youssef", "Amira", "Mohamed"] },
  { id: "1am_b", name: "1AM B", cycle: "moyen", year: 1, studentNames: ["Imane", "Redha", "Nesrine", "Sami", "Dounia", "Rayan"] },
  { id: "2am_a", name: "2AM A", cycle: "moyen", year: 2, studentNames: ["Houda", "Anis", "Meriem", "Rafik", "Sofia", "Ryad"] },
  { id: "3am_a", name: "3AM A", cycle: "moyen", year: 3, studentNames: ["Kenza", "Lyes", "Yasmine", "Nadir", "Ines", "Walid"] },
  { id: "3am_b", name: "3AM B", cycle: "moyen", year: 3, studentNames: ["Rania", "Tahar", "Nour", "Ismail", "Dalia", "Zakaria"] },
];

// ---- Hook ----
export function useTeacherData() {
  const [sections, setSectionsState] = useState<ClassSection[]>([]);
  const [attendance, setAttendanceState] = useState<AttendanceRecord[]>([]);
  const [behaviorNotes, setBehaviorNotesState] = useState<BehaviorNote[]>([]);
  const [schedule, setScheduleState] = useState<ScheduleEntry[]>([]);
  const [parentMessages, setParentMessagesState] = useState<ParentMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sec = localStorage.getItem("bloom_sections");
    setSectionsState(sec ? JSON.parse(sec) : DEFAULT_SECTIONS);
    const att = localStorage.getItem("bloom_attendance");
    setAttendanceState(att ? JSON.parse(att) : []);
    const beh = localStorage.getItem("bloom_behavior_notes");
    setBehaviorNotesState(beh ? JSON.parse(beh) : []);
    const sch = localStorage.getItem("bloom_schedule");
    setScheduleState(sch ? JSON.parse(sch) : []);
    const msg = localStorage.getItem("bloom_parent_messages");
    setParentMessagesState(msg ? JSON.parse(msg) : []);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("bloom_sections", JSON.stringify(sections));
  }, [sections, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("bloom_attendance", JSON.stringify(attendance));
  }, [attendance, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("bloom_behavior_notes", JSON.stringify(behaviorNotes));
  }, [behaviorNotes, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("bloom_schedule", JSON.stringify(schedule));
  }, [schedule, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("bloom_parent_messages", JSON.stringify(parentMessages));
  }, [parentMessages, mounted]);

  const updateSection = useCallback((updated: ClassSection) => {
    setSectionsState(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, []);

  const addStudentToSection = useCallback((sectionId: string, name: string) => {
    setSectionsState(prev => prev.map(s =>
      s.id === sectionId ? { ...s, studentNames: [...s.studentNames, name] } : s
    ));
  }, []);

  const removeStudentFromSection = useCallback((sectionId: string, name: string) => {
    setSectionsState(prev => prev.map(s =>
      s.id === sectionId ? { ...s, studentNames: s.studentNames.filter(n => n !== name) } : s
    ));
  }, []);

  const markAttendance = useCallback((records: Omit<AttendanceRecord, "date">[], date: string) => {
    const dateStr = date || new Date().toISOString().slice(0, 10);
    setAttendanceState(prev => {
      const filtered = prev.filter(r => r.date !== dateStr || r.sectionId !== records[0]?.sectionId);
      return [...filtered, ...records.map(r => ({ ...r, date: dateStr }))];
    });
  }, []);

  const getAttendanceForSection = useCallback((sectionId: string, date: string) => {
    return attendance.filter(r => r.sectionId === sectionId && r.date === date);
  }, [attendance]);

  const getAttendanceForStudent = useCallback((studentName: string) => {
    return attendance.filter(r => r.studentName === studentName);
  }, [attendance]);

  const addBehaviorNote = useCallback((note: Omit<BehaviorNote, "id" | "date">) => {
    const entry: BehaviorNote = {
      ...note,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString().slice(0, 10),
    };
    setBehaviorNotesState(prev => [entry, ...prev]);
  }, []);

  const deleteBehaviorNote = useCallback((id: string) => {
    setBehaviorNotesState(prev => prev.filter(n => n.id !== id));
  }, []);

  const getBehaviorForStudent = useCallback((studentName: string) => {
    return behaviorNotes.filter(n => n.studentName === studentName);
  }, [behaviorNotes]);

  const addScheduleEntry = useCallback((entry: Omit<ScheduleEntry, "id">) => {
    const e: ScheduleEntry = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    setScheduleState(prev => [...prev, e]);
  }, []);

  const removeScheduleEntry = useCallback((id: string) => {
    setScheduleState(prev => prev.filter(e => e.id !== id));
  }, []);

  const getScheduleForDay = useCallback((day: number) => {
    return schedule.filter(e => e.day === day);
  }, [schedule]);

  const sendParentMessage = useCallback((msg: Omit<ParentMessage, "id" | "date">) => {
    const m: ParentMessage = {
      ...msg,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
    };
    setParentMessagesState(prev => [m, ...prev]);
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setParentMessagesState(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }, []);

  const getMessagesForStudent = useCallback((studentName: string) => {
    return parentMessages.filter(m => m.studentName === studentName);
  }, [parentMessages]);

  const getUnreadParentMessages = useCallback(() => {
    return parentMessages.filter(m => m.from === "parent" && !m.read);
  }, [parentMessages]);

  return {
    sections, updateSection, addStudentToSection, removeStudentFromSection,
    attendance, markAttendance, getAttendanceForSection, getAttendanceForStudent,
    behaviorNotes, addBehaviorNote, deleteBehaviorNote, getBehaviorForStudent,
    schedule, addScheduleEntry, removeScheduleEntry, getScheduleForDay,
    parentMessages, sendParentMessage, markMessageRead, getMessagesForStudent, getUnreadParentMessages,
  };
}

export type UseTeacherData = ReturnType<typeof useTeacherData>;
