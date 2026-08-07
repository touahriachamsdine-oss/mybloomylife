"use client";
import React, { useState } from "react";
import { useBloom } from "@/context/BloomContext";
import { Heart, Trash2, Sparkles } from "lucide-react";

function GratitudeScreen({
  t,
  addPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  addPoints: (pts: number) => void;
}) {
  const { isRtl, gratitudeEntries, updateGratitudeEntries } = useBloom();
  const [newGratitudeText, setNewGratitudeText] = useState("");
  const [newGratitudeEmoji, setNewGratitudeEmoji] = useState("❤️");

  const saveGratitudeEntries = (entries: typeof gratitudeEntries) => {
    updateGratitudeEntries(entries);
  };

  const handleAddGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGratitudeText.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      text: newGratitudeText.trim(),
      emoji: newGratitudeEmoji,
      date: new Date().toLocaleDateString(isRtl ? "ar-DZ" : "en-US")
    };
    saveGratitudeEntries([newEntry, ...gratitudeEntries]);
    addPoints(20);
    setNewGratitudeText("");
  };

  const handleDeleteGratitude = (idToDelete: string) => {
    const updated = gratitudeEntries.filter((e) => e.id !== idToDelete);
    saveGratitudeEntries(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-text-primary flex items-center gap-2">
            <Sparkles className="text-pink-500" size={20} />
            <span>{t("grat_title")}</span>
          </h2>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
            {t("grat_moments_count", gratitudeEntries.length)}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
          {t("grat_subtitle")}
        </p>
      </div>

      {/* Form to add a Gratitude entry */}
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
        <h3 className="font-black text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Heart size={14} className="text-pink-500" />
          <span>{t("grat_question")}</span>
        </h3>

        <form onSubmit={handleAddGratitude} className="flex flex-col gap-3">
          <div className="flex gap-2 justify-center">
            {["❤️", "🌸", "✨", "☀️", "🌟", "🍀", "🌈"].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setNewGratitudeEmoji(em)}
                className={`p-2 rounded-2xl border text-lg transition-all ${
                  newGratitudeEmoji === em
                    ? "bg-pink-500/20 border-pink-500 scale-110 shadow-xs"
                    : "bg-surface border-border-custom hover:bg-border-custom/20"
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          <textarea
            value={newGratitudeText}
            onChange={(e) => setNewGratitudeText(e.target.value)}
            placeholder={t("grat_placeholder")}
            rows={3}
            required
            className="w-full p-3 rounded-2xl border border-border-custom bg-surface text-xs focus:ring-2 focus:ring-pink-500/20 outline-none resize-none text-text-primary font-semibold leading-relaxed"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-xs font-black shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{newGratitudeEmoji}</span>
            <span>{t("grat_save_btn")}</span>
          </button>
        </form>
      </div>

      {/* List of Gratitude entries */}
      <div className="flex flex-col gap-2.5">
        {gratitudeEntries.length === 0 ? (
          <div className="p-6 text-center rounded-3xl bg-surface border border-border-custom/60 flex flex-col items-center gap-2">
            <span className="text-3xl">💖</span>
            <p className="text-xs font-bold text-text-secondary">
              {t("grat_empty")}
            </p>
          </div>
        ) : (
          gratitudeEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-2xl bg-surface border border-pink-500/20 shadow-xs flex flex-col gap-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{entry.emoji}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-text-secondary">{entry.date}</span>
                  <button
                    onClick={() => handleDeleteGratitude(entry.id)}
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

        {/* Inspirational Quote box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 text-center flex flex-col gap-1 mt-1">
          <span className="text-xs font-black text-pink-600 dark:text-pink-300">{t("grat_wisdom_title")}</span>
          <p className="text-[11px] text-text-secondary font-semibold italic">
            {t("grat_wisdom_text")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCREEN: Goals Screen
   ========================================================================== */

export default GratitudeScreen;
