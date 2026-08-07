"use client";
import React, { useState } from "react";
import { useBloom } from "@/context/BloomContext";
import { Plus, Trash2, BookOpen } from "lucide-react";

function LearningJournalScreen({
  t,
  addPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  addPoints: (pts: number) => void;
}) {
  const { isRtl, learningEntries, updateLearningEntries } = useBloom();
  const [newLearningText, setNewLearningText] = useState("");
  const [newLearningSubject, setNewLearningSubject] = useState("عام");
  const [newLearningEmoji, setNewLearningEmoji] = useState("💡");

  const saveLearningEntries = (entries: typeof learningEntries) => {
    updateLearningEntries(entries);
  };

  const handleAddLearning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearningText.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      subject: newLearningSubject,
      text: newLearningText.trim(),
      emoji: newLearningEmoji,
      date: new Date().toLocaleDateString(isRtl ? "ar-DZ" : "en-US")
    };
    saveLearningEntries([newEntry, ...learningEntries]);
    addPoints(20);
    setNewLearningText("");
  };

  const handleDeleteLearning = (idToDelete: string) => {
    const updated = learningEntries.filter((e) => e.id !== idToDelete);
    saveLearningEntries(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-text-primary flex items-center gap-2">
            <BookOpen className="text-primary" size={20} />
            <span>{t("learn_title")}</span>
          </h2>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {t("learn_entries_count", learningEntries.length)}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
          {t("learn_subtitle")}
        </p>
      </div>

      {/* Form to add a Learning entry */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Plus size={14} className="text-primary" />
          <span>{t("learn_add_new")}</span>
        </h3>

        <form onSubmit={handleAddLearning} className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {["عام", "الرياضيات", "الفيزياء", "العلوم", "اللغات", "التاريخ"].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setNewLearningSubject(sub)}
                className={`px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                  newLearningSubject === sub
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border-custom text-text-secondary hover:text-text-primary"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            {["💡", "📐", "🧪", "📖", "🎯", "🚀"].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setNewLearningEmoji(em)}
                className={`p-1.5 rounded-xl border text-base transition-all ${
                  newLearningEmoji === em
                    ? "bg-primary/20 border-primary scale-110"
                    : "bg-surface border-border-custom hover:bg-border-custom/20"
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          <textarea
            value={newLearningText}
            onChange={(e) => setNewLearningText(e.target.value)}
            placeholder={t("learn_placeholder")}
            rows={3}
            required
            className="w-full p-3 rounded-2xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none text-text-primary font-semibold leading-relaxed"
          />

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{newLearningEmoji}</span>
            <span>{t("learn_save_btn")}</span>
          </button>
        </form>
      </div>

      {/* List of Learning entries */}
      <div className="flex flex-col gap-2.5">
        {learningEntries.length === 0 ? (
          <div className="p-6 text-center rounded-3xl bg-surface border border-border-custom/60 flex flex-col items-center gap-2">
            <span className="text-3xl">📚</span>
            <p className="text-xs font-bold text-text-secondary">
              {t("learn_empty")}
            </p>
          </div>
        ) : (
          learningEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-2xl bg-surface border border-border-custom/70 shadow-xs flex flex-col gap-2 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{entry.emoji}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {entry.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-text-secondary">{entry.date}</span>
                  <button
                    onClick={() => handleDeleteLearning(entry.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    aria-label={t("learn_delete_entry")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold text-text-primary leading-relaxed pr-1">
                {entry.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SCREEN: Gratitude Journal Screen (سجل الامتنان)
   ========================================================================== */

export default LearningJournalScreen;
