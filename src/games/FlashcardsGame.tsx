"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Brain,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { AlgerianCycle, Flashcard } from "./types";

const FLASHCARDS_BY_CYCLE: Record<AlgerianCycle, Flashcard[]> = {
  primaire: [
    { question: "What planet is known as the Red Planet?", answer: "Mars" },
    { question: "What gas do plants absorb?", answer: "Carbon Dioxide" },
    { question: "How many legs does an insect have?", answer: "6" },
    { question: "What is the largest organ in the human body?", answer: "Skin" },
    { question: "What force pulls objects toward Earth?", answer: "Gravity" },
    { question: "What is H2O?", answer: "Water" },
    { question: "Which animal lives in a hive?", answer: "Bee" },
    { question: "What is the closest star to Earth?", answer: "The Sun" },
    { question: "How many bones are in the adult human body?", answer: "206" },
    { question: "What part of the plant absorbs water?", answer: "Roots" }
  ],
  moyen: [
    { question: "What is the chemical symbol for gold?", answer: "Au" },
    { question: "What type of energy comes from the sun?", answer: "Solar Energy" },
    { question: "What is the powerhouse of the cell?", answer: "Mitochondria" },
    { question: "What is the speed of light?", answer: "300,000 km/s" },
    { question: "What causes ocean tides?", answer: "The Moon's gravity" },
    { question: "What is the largest planet?", answer: "Jupiter" },
    { question: "What is the process of water turning into vapor?", answer: "Evaporation" },
    { question: "What is the main gas in Earth's atmosphere?", answer: "Nitrogen" },
    { question: "What organ pumps blood?", answer: "The Heart" },
    { question: "What is the study of fossils called?", answer: "Paleontology" }
  ],
  lycee: [
    { question: "What is the formula for photosynthesis?", answer: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
    { question: "What is Newton's Second Law?", answer: "F = ma" },
    { question: "What is the uncertainty principle?", answer: "Δx·Δp ≥ h/4π" },
    { question: "What is the unit of electric current?", answer: "Ampere" },
    { question: "What is DNA replication?", answer: "The process of copying DNA" },
    { question: "What is the Hardy-Weinberg principle?", answer: "Equilibrium in population genetics" },
    { question: "What is an isotope?", answer: "Atoms with same protons, different neutrons" },
    { question: "What is the Krebs cycle?", answer: "Citric acid cycle in cellular respiration" },
    { question: "What is electromotive force?", answer: "Energy per unit charge from a source" },
    { question: "What is the Doppler effect?", answer: "Change in frequency due to relative motion" }
  ]
};

export default function FlashcardsGame({
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
  const cards = useMemo(() => FLASHCARDS_BY_CYCLE[cycle], [cycle]);
  const total = cards.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCards, setCorrectCards] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const currentCard = cards[currentIdx];
  const markedCorrect = correctCards.size;

  const handleFlip = () => {
    setIsFlipped((p) => !p);
  };

  const handleMarkCorrect = () => {
    setCorrectCards((prev) => new Set(prev).add(currentIdx));
    goToNext();
  };

  const handleMarkStudyAgain = () => {
    goToNext();
  };

  const goToNext = () => {
    if (currentIdx + 1 < total) {
      setCurrentIdx((p) => p + 1);
      setIsFlipped(false);
    } else {
      const earned = markedCorrect * 15 + (isFlipped && correctCards.has(currentIdx) ? 15 : 0);
      setPointsEarned(earned);
      setIsFinished(true);
      addPoints(earned);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((p) => p - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setCorrectCards(new Set());
    setIsFinished(false);
    setPointsEarned(0);
  };

  if (isFinished) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Brain style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("flash_congrats") || "Flashcards Complete!"}</h4>
          <p className="text-xs text-text-secondary mt-1">Great memory work! Review completed.</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>{t("flash_correct") || "Cards Mastered"}</span>
            <span className="font-black text-green-500">{markedCorrect} / {total}</span>
          </div>
          <div className="flex justify-between font-black" style={{ color: "var(--accent-orange)" }}>
            <span>{t("flash_points") || "Points Earned"}</span>
            <span>+{pointsEarned} Pts</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            {t("flash_play_again") || "Play Again"}
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
          {t("flash_title") || "Flashcards"}
        </span>
        <span className="text-xs font-black text-primary">
          {currentIdx + 1}/{total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1"><Brain size={10} /> Card {currentIdx + 1} of {total}</span>
          <span>{Math.round(((currentIdx + 1) / total) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex justify-between text-xs font-bold text-text-primary">
        <span className="flex items-center gap-1">
          <Sparkles size={14} style={{ color: "var(--accent-yellow)" }} /> {t("flash_mastered") || "Mastered"}: {markedCorrect}
        </span>
      </div>

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="w-full aspect-[3/2] relative perspective-1000 cursor-pointer"
      >
        <div
          className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front - Question */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 border border-primary/20 flex flex-col items-center justify-center p-6 backface-hidden shadow-md">
            <Sparkles className="text-white/30 mb-3" size={28} />
            <p className="text-white font-black text-center text-base leading-relaxed">
              {currentCard.question}
            </p>
            <p className="text-white/50 text-[10px] font-bold mt-4 uppercase tracking-wider">
              {t("flash_tap") || "Tap to reveal"}
            </p>
          </div>
          {/* Back - Answer */}
          <div className="absolute inset-0 rounded-2xl bg-surface border-2 border-primary/30 flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180 shadow-md">
            <Brain size={28} className="text-primary mb-3" />
            <p className="text-text-primary font-black text-center text-base leading-relaxed">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Self-assessment Buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <button
            onClick={handleMarkCorrect}
            className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 font-black text-xs hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Check size={14} />
            {t("flash_got_it") || "Got it!"}
          </button>
          <button
            onClick={handleMarkStudyAgain}
            className="flex-1 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 font-black text-xs hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <X size={14} />
            {t("flash_study_again") || "Study again"}
          </button>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="p-2.5 rounded-xl bg-border-custom/30 hover:bg-border-custom/50 text-text-secondary disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        {!isFlipped && (
          <button
            onClick={() => setIsFlipped(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all"
          >
            {t("flash_reveal") || "Reveal Answer"}
          </button>
        )}
        <button
          onClick={goToNext}
          className="p-2.5 rounded-xl bg-border-custom/30 hover:bg-border-custom/50 text-text-secondary transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
