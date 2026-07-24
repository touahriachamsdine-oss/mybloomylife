"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Clock, MapPin } from "lucide-react";
import type { UseTeacherData } from "@/context/teacher";

interface Props {
  t: (k: string, ...a: (string | number)[]) => string;
  teacher: UseTeacherData;
  onNavigate: (screen: string) => void;
}

const DAYS = [0, 1, 2, 3, 4];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const SUBJECTS = [
  "subject_arabic", "subject_tamazight", "subject_french", "subject_english",
  "subject_math", "subject_physics", "subject_science", "subject_islamic",
  "subject_history_geo", "subject_civic", "subject_philosophy",
];

export default function TeacherSchedule({ t, teacher, onNavigate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newDay, setNewDay] = useState(0);
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("09:00");
  const [newSubject, setNewSubject] = useState(SUBJECTS[0]);
  const [newSectionId, setNewSectionId] = useState(teacher.sections[0]?.id || "");
  const [newRoom, setNewRoom] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    teacher.addScheduleEntry({ day: newDay, startTime: newStart, endTime: newEnd, subject: newSubject, sectionId: newSectionId, room: newRoom || undefined });
    setShowForm(false);
  };

  return (
    <>
      <button onClick={() => onNavigate("back")} className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-2">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h2 className="text-sm font-black text-text-primary">{t("teacher_schedule")}</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-primary text-white py-2 px-3 rounded-xl text-[10px] font-bold hover:bg-primary/90 transition-all">
          <Plus size={12} /> {t("teacher_add_entry")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleAdd}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-text-primary">{t("teacher_add_entry")}</span>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-border-custom/50"><Trash2 size={16} /></button>
              </div>

              <select value={newDay} onChange={e => setNewDay(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
                {DAYS.map(d => <option key={d} value={d}>{t(DAY_KEYS[d])}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-text-secondary">{t("teacher_start")}</label>
                  <select value={newStart} onChange={e => setNewStart(e.target.value)}
                    className="p-2 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-text-secondary">{t("teacher_end")}</label>
                  <select value={newEnd} onChange={e => setNewEnd(e.target.value)}
                    className="p-2 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
                    {TIME_SLOTS.filter(t => t > newStart).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
                {SUBJECTS.map(s => <option key={s} value={s}>{t(s)}</option>)}
              </select>

              <select value={newSectionId} onChange={e => setNewSectionId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
                {teacher.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <input type="text" value={newRoom} onChange={e => setNewRoom(e.target.value)} placeholder={t("teacher_room_placeholder")}
                className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary" />

              <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black">{t("save")}</button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-5 gap-1.5">
          {DAYS.map(day => (
            <div key={day} className="flex flex-col gap-1">
              <div className="text-center text-[10px] font-black text-primary bg-primary/5 py-2 rounded-xl border border-primary/10">
                {t(DAY_KEYS[day])}
              </div>
              {TIME_SLOTS.map(slot => {
                const entry = teacher.schedule.find(e => e.day === day && e.startTime === slot);
                const section = entry ? teacher.sections.find(s => s.id === entry.sectionId) : null;
                return (
                  <div key={`${day}-${slot}`}
                    className={`min-h-[44px] p-1.5 rounded-lg text-[8px] leading-tight border transition-all ${entry ? "bg-primary/10 border-primary/20" : "border-border-custom/30 bg-surface/50"}`}>
                    {entry && (
                      <>
                        <div className="font-black text-text-primary truncate">{t(entry.subject)}</div>
                        <div className="font-bold text-primary truncate">{section?.name || entry.sectionId}</div>
                        {entry.room && <div className="text-text-secondary flex items-center gap-0.5 mt-0.5"><MapPin size={8} /> {entry.room}</div>}
                        <button onClick={() => teacher.removeScheduleEntry(entry.id)}
                          className="mt-0.5 text-red-400 hover:text-red-500">
                          <Trash2 size={8} />
                        </button>
                      </>
                    )}
                    {!entry && <span className="text-text-secondary/30">—</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
