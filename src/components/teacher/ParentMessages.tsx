"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, MessageSquare, User, Eye } from "lucide-react";
import type { UseTeacherData } from "@/context/teacher";

interface Props {
  t: (k: string, ...a: (string | number)[]) => string;
  teacher: UseTeacherData;
  onNavigate: (screen: string) => void;
}

export default function ParentMessages({ t, teacher, onNavigate }: Props) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showSend, setShowSend] = useState(false);

  const allStudentNames = Array.from(new Set(teacher.sections.flatMap(s => s.studentNames))).sort();
  const messages = selectedStudent ? teacher.getMessagesForStudent(selectedStudent) : [];
  const unread = teacher.getUnreadParentMessages();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedStudent) return;
    teacher.sendParentMessage({ from: "teacher", studentName: selectedStudent, content: messageText, read: false });
    setMessageText("");
    setShowSend(false);
  };

  return (
    <>
      <button onClick={() => onNavigate("back")} className="flex items-center gap-1 text-xs font-bold text-text-secondary mb-2">
        <ArrowLeft size={14} /> {t("back")}
      </button>

      {unread.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <Eye size={14} className="text-amber-600" />
          <span className="text-[10px] font-bold text-amber-600">{t("teacher_unread_messages")}: {unread.length}</span>
        </div>
      )}

      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-500" />
          <h2 className="text-sm font-black text-text-primary">{t("teacher_messages")}</h2>
        </div>

        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-border-custom bg-surface text-xs font-bold text-text-primary">
          <option value="">{t("teacher_select_student")}</option>
          {allStudentNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {selectedStudent && (
          <button onClick={() => setShowSend(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all">
            <Send size={14} /> {t("teacher_send_message")}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSend && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSend}
              className="bg-surface rounded-3xl p-5 border border-border-custom shadow-2xl w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-primary" />
                <span className="font-black text-sm text-text-primary">{t("teacher_send_message")} — {selectedStudent}</span>
              </div>
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={4}
                placeholder={t("teacher_message_placeholder")}
                className="w-full p-3 rounded-xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary" required />
              <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black">{t("send")}</button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {selectedStudent && (
        <div className="flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="p-6 rounded-3xl bg-surface border border-border-custom/50 flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-border-custom" />
              <p className="text-xs font-bold text-text-secondary">{t("teacher_no_messages")}</p>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} className={`p-3 rounded-2xl border ${m.from === "teacher" ? "bg-primary/5 border-primary/20" : "bg-purple-500/5 border-purple-500/20"} flex flex-col gap-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-text-secondary">
                    {m.from === "teacher" ? t("teacher_you") : t("parent")}
                    {m.from === "parent" && !m.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </span>
                  <span className="text-[8px] text-text-secondary">{new Date(m.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-medium text-text-primary">{m.content}</p>
                {m.from === "parent" && (
                  <button onClick={() => teacher.markMessageRead(m.id)}
                    className="self-end text-[8px] font-bold text-primary hover:underline">{t("teacher_mark_read")}</button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
