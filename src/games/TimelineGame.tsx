"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Trophy,
  Clock
} from "lucide-react";
import { AlgerianCycle, TimelineEvent } from "./types";

const EVENTS_BY_CYCLE: Record<AlgerianCycle, TimelineEvent[]> = {
  primaire: [
    { year: 2024, label: "Current Year" },
    { year: 2000, label: "Year 2000" },
    { year: 1990, label: "Fall of Berlin Wall" },
    { year: 1980, label: "First PC" },
    { year: 1962, label: "Algerian Independence" }
  ],
  moyen: [
    { year: 1962, label: "Algerian Independence" },
    { year: 1954, label: "Algerian Revolution" },
    { year: 1830, label: "French Colonization" },
    { year: 1516, label: "Capture of Algiers" },
    { year: 1469, label: "Birth of Cervantes" }
  ],
  lycee: [
    { year: 1962, label: "Algérie indépendante" },
    { year: 1954, label: "Guerre de Libération" },
    { year: 1945, label: "Fin WWII" },
    { year: 1914, label: "WWI begins" },
    { year: 1830, label: "Conquête française" }
  ]
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TimelineGame({
  t,
  onExit,
  addPoints,
  cycle
}: {
  t: (k: string, ...a: any[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
}) {
  const events = useMemo(() => EVENTS_BY_CYCLE[cycle], [cycle]);
  const shuffled = useMemo(() => shuffleArray(events), [cycle]);

  const [selection, setSelection] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [pointsEarned, setPointsEarned] = useState(0);

  const correctOrder = useMemo(() => [...events].sort((a, b) => b.year - a.year), [events]);

  const handleToggle = (index: number) => {
    if (checked) return;
    setSelection((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= 5) return prev;
      return [...prev, index];
    });
  };

  const handleCheckOrder = () => {
    const ordered = selection.map((i) => shuffled[i]);
    const res = ordered.map((ev, idx) => ev.year === correctOrder[idx].year);
    setResults(res);
    setChecked(true);
    const correctCount = res.filter(Boolean).length;
    const earned = correctCount * 20;
    setPointsEarned(earned);
    addPoints(earned);
  };

  const handleRestart = () => {
    setSelection([]);
    setChecked(false);
    setResults([]);
    setPointsEarned(0);
  };

  const isFull = selection.length === 5;

  if (checked) {
    const correctCount = results.filter(Boolean).length;
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("timeline_result") || "Timeline Complete!"}</h4>
          <p className="text-xs text-text-secondary mt-1">Here&apos;s how you sorted history.</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          {/* Show ordered results */}
          <div className="flex flex-col gap-1.5">
            {selection.map((origIdx, pos) => {
              const ev = shuffled[origIdx];
              const isCorrect = results[pos];
              return (
                <div
                  key={origIdx}
                  className={`flex items-center justify-between p-2 rounded-xl ${
                    isCorrect
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                      {isCorrect ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <span className="text-xs">{ev.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-black ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                    {ev.year}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between pt-2 border-t border-border-custom/30">
            <span>{t("timeline_correct") || "Correct"}</span>
            <span className="font-black text-green-500">{correctCount} / 5</span>
          </div>
          <div className="flex justify-between font-black" style={{ color: "var(--accent-orange)" }}>
            <span>{t("timeline_points") || "Points Earned"}</span>
            <span>+{pointsEarned} Pts</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            {t("timeline_play_again") || "Play Again"}
          </button>
          <button
            onClick={onExit}
            className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl text-xs font-black transition-all"
          >
            {t("mem_finish_game")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
          <ArrowLeft size={16} />
          {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary uppercase tracking-wide">
          {t("timeline_title") || "Timeline"}
        </span>
        <span className="text-xs font-black text-primary">
          {selection.length}/5
        </span>
      </div>

      {/* Instructions */}
      <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock size={14} className="text-primary" />
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
            {t("timeline_instruction_title") || "Instructions"}
          </span>
        </div>
        <p className="text-xs font-bold text-text-primary leading-relaxed">
          {t("timeline_instruction") || "Tap events in chronological order (oldest first)."}
        </p>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-2">
        {shuffled.map((ev, idx) => {
          const selectedIdx = selection.indexOf(idx);
          const isSelected = selectedIdx !== -1;
          return (
            <button
              key={ev.year + ev.label}
              onClick={() => handleToggle(idx)}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
              }`}
            >
              {/* Badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-border-custom/50 text-text-secondary"
              }`}>
                {isSelected ? selectedIdx + 1 : idx + 1}
              </div>
              <span className="text-sm font-bold">{ev.label}</span>
            </button>
          );
        })}
      </div>

      {/* Check Order Button */}
      <button
        onClick={handleCheckOrder}
        disabled={!isFull}
        className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        {t("timeline_check") || "Check Order"}
      </button>
    </div>
  );
}
