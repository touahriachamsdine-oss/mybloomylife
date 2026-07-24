"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, ThumbsUp, ThumbsDown, MessageSquare, User } from "lucide-react";
import type { UseTeacherData } from "@/context/teacher";

interface Props {
  t: (k: string, ...a: (string | number)[]) => string;
  teacher: UseTeacherData;
  onNavigate: (screen: string) => void;
}

export default function BehaviorNotes({ t, teacher, onNavigate }: Props) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"positive" | "negative" | "general">("general");
  const [showForm, setShowForm] = useState(false);

  const allStudentNames = Array.from(new Set(teacher.sections.flatMap(s => s.studentNames))).sort();

  const notes = selectedStudent ? teacher.getBehaviorForStudent(selectedStudent) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedStudent) return;
    teacher.addBehaviorNote({ studentName: selectedStudent, type: noteType, note: noteText, teacherName: "" });
    setNoteText("");
    setShowForm(false);
  };

  const typeColors: Record<string, string> = {
    positive: "bg-green-500/10 border-green-500/20 text-green-600",
    negative: "bg-red-500/10 border-red-500/20 text-red-500",
    general: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    positive: <ThumbsUp size={12} />,
    negative: <ThumbsDown size={12} />,
    general: <MessageSquare size={12} />,
  };

  const typeKeys: Record<string, string> = {
    positive: "positive",
    negative: "negative",
    general: "general",
  };

  return (
    <>
      <button onClick={() => onNavigate("back")} className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-2">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-amber-500" />
          <h2 className="text-sm font-black text-text-primary">{t("teacher_behavior")}</h2>
        </div>

        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
          <option value="">{t("teacher_select_student")}</option>
          {allStudentNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {selectedStudent && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all">
            <Plus size={14} /> {t("teacher_add_note")}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSubmit}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-text-primary">{t("teacher_add_note")}</span>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-border-custom/50"><Trash2 size={16} /></button>
              </div>

              <div className="flex gap-1.5">
                {(["positive", "general", "negative"] as const).map(type => (
                  <button key={type} type="button" onClick={() => setNoteType(type)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${noteType === type ? typeColors[type] : "border-border-custom text-text-secondary"}`}>
                    {typeIcons[type]} {t(typeKeys[type])}
                  </button>
                ))}
              </div>

              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                placeholder={t("teacher_note_placeholder")}
                className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary" required />

              <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black">{t("save")}</button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {selectedStudent && (
        <div className="flex flex-col gap-2">
          {notes.length === 0 ? (
            <div className="p-6 rounded-3xl bg-surface border border-border-custom/50 flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-border-custom" />
              <p className="text-xs font-bold text-text-secondary">{t("teacher_no_notes")}</p>
            </div>
          ) : (
            notes.map(n => (
              <div key={n.id} className={`p-3 rounded-2xl border ${typeColors[n.type]} flex flex-col gap-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase">{typeIcons[n.type]} {t(n.type)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-text-secondary">{n.date}</span>
                    <button onClick={() => teacher.deleteBehaviorNote(n.id)} className="p-1 rounded-lg hover:bg-black/10">
                      <Trash2 size={12} className="text-text-secondary" />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium text-text-primary">{n.note}</p>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
