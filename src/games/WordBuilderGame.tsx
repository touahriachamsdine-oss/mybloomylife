"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Lightbulb, RefreshCw, Check, X, Sparkles } from "lucide-react";
import { AlgerianCycle, WordBuilderWord } from "./types";

const WORDS_BY_CYCLE: Record<AlgerianCycle, WordBuilderWord[]> = {
  primaire: [
    { scrambled: "KOBO", answer: "BOOK", hint: "B" },
    { scrambled: "EETR", answer: "TREE", hint: "T" },
    { scrambled: "IFSH", answer: "FISH", hint: "F" },
    { scrambled: "RIDB", answer: "BIRD", hint: "B" },
    { scrambled: "RATS", answer: "STAR", hint: "S" },
    { scrambled: "NOOM", answer: "MOON", hint: "M" },
    { scrambled: "IFRE", answer: "FIRE", hint: "F" },
    { scrambled: "TWAER", answer: "WATER", hint: "W" },
    { scrambled: "NUS", answer: "SUN", hint: "S" },
    { scrambled: "NAIR", answer: "RAIN", hint: "R" },
  ],
  moyen: [
    { scrambled: "CICESEN", answer: "SCIENCE", hint: "S" },
    { scrambled: "TANURE", answer: "NATURE", hint: "N" },
    { scrambled: "RENYGE", answer: "ENERGY", hint: "E" },
    { scrambled: "TNALPE", answer: "PLANET", hint: "P" },
    { scrambled: "NAIMLA", answer: "ANIMAL", hint: "A" },
    { scrambled: "IDGREB", answer: "BRIDGE", hint: "B" },
    { scrambled: "ROSETF", answer: "FOREST", hint: "F" },
    { scrambled: "TAMCLIE", answer: "CLIMATE", hint: "C" },
    { scrambled: "AECNO", answer: "OCEAN", hint: "O" },
    { scrambled: "RESTED", answer: "DESERT", hint: "D" },
  ],
  lycee: [
    { scrambled: "YNHSPOHTESISSY", answer: "PHOTOSYNTHESIS", hint: "P" },
    { scrambled: "NOVLUITOE", answer: "EVOLUTION", hint: "E" },
    { scrambled: "OYSCEEESTM", answer: "ECOSYSTEM", hint: "E" },
    { scrambled: "MULLIIQRBIEU", answer: "EQUILIBRIUM", hint: "E" },
    { scrambled: "TCLAVZNIOILII", answer: "CIVILIZATION", hint: "C" },
    { scrambled: "GHIMLOATR", answer: "ALGORITHM", hint: "A" },
    { scrambled: "MOCRYAECD", answer: "DEMOCRACY", hint: "D" },
    { scrambled: "PYTOSHSHIEI", answer: "HYPOTHESIS", hint: "H" },
    { scrambled: "CMLOEULE", answer: "MOLECULE", hint: "M" },
    { scrambled: "YPLSHOIOPH", answer: "PHILOSOPHY", hint: "P" },
  ],
};

export default function WordBuilderGame({
  t,
  onExit,
  addPoints,
  cycle,
}: {
  t: (k: string, ...a: any[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
}) {
  const [words] = useState<WordBuilderWord[]>(() => {
    const pool = WORDS_BY_CYCLE[cycle];
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentWord = words[currentIdx];

  const handleSubmit = () => {
    if (!input.trim() || result !== null) return;
    const isCorrect = input.trim().toUpperCase() === currentWord.answer;
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      const pts = hintUsed ? 10 : 15;
      setScore((s) => s + pts);
      addPoints(pts);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < words.length) {
      setCurrentIdx((i) => i + 1);
      setInput("");
      setResult(null);
      setHintUsed(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleHint = () => {
    if (!hintUsed && !showHint) {
      setHintUsed(true);
      setShowHint(true);
    }
  };

  const handleRestart = () => {
    const pool = WORDS_BY_CYCLE[cycle];
    const reshuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    words.splice(0, words.length, ...reshuffled);
    setCurrentIdx(0);
    setInput("");
    setResult(null);
    setScore(0);
    setHintUsed(false);
    setShowHint(false);
    setIsFinished(false);
  };

  if (isFinished) {
    const totalPossible = words.length * 15;
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("quiz_congrats")}</h4>
          <p className="text-xs text-text-secondary mt-1">{t("quiz_finished_desc")}</p>
        </div>
        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>{t("quiz_correct_count", score / 15, words.length)}</span>
            <span>{Math.round((score / totalPossible) * 100)}%</span>
          </div>
          <div className="flex justify-between font-black" style={{ color: "var(--accent-orange)" }}>
            <span>Points Earned</span>
            <span>+{score} Pts</span>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            Play Again
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
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button
          onClick={onExit}
          className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black"
        >
          <ArrowLeft size={16} />
          {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary uppercase tracking-wide">Word Builder</span>
        <span className="text-xs font-black text-primary">{currentIdx + 1}/{words.length}</span>
      </div>

      <div className="flex items-center justify-center gap-1 py-2">
        {words.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentIdx
                ? "bg-primary scale-125"
                : i < currentIdx
                ? "bg-primary/40"
                : "bg-border-custom"
            }`}
          />
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-border-custom/20 border border-border-custom/30 flex flex-col items-center gap-3">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
          Unscramble the word
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-4xl font-black tracking-[0.3em] text-primary py-4 px-6 rounded-2xl bg-surface border border-border-custom shadow-inner select-none"
          >
            {currentWord.scrambled.split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={result !== null}
            placeholder="Type the word..."
            className="w-full py-3.5 px-4 rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all text-center tracking-[0.2em] uppercase"
            autoFocus
          />
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-6 left-0 right-0 text-center text-xs font-bold text-primary"
            >
              Hint: starts with "{currentWord.hint}"
            </motion.div>
          )}
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={handleHint}
            disabled={hintUsed || result !== null}
            className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              hintUsed
                ? "bg-border-custom/30 text-text-secondary/50 cursor-not-allowed"
                : "bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30 border border-accent-yellow/20"
            }`}
          >
            <Lightbulb size={14} />
            Hint
          </button>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || result !== null}
            className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-30 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-black shadow-xs transition-all"
          >
            Submit
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
              result === "correct"
                ? "bg-green-500/10 border border-green-500/20 text-green-600"
                : "bg-red-500/10 border border-red-500/20 text-red-500"
            }`}
          >
            {result === "correct" ? (
              <>
                <Check size={16} className="shrink-0" />
                <span>Correct! +{hintUsed ? 10 : 15} points</span>
              </>
            ) : (
              <>
                <X size={16} className="shrink-0" />
                <span>
                  Wrong! The answer was <strong>{currentWord.answer}</strong>
                </span>
              </>
            )}
            <button
              onClick={handleNext}
              className="ml-auto bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-black text-xs transition-all"
            >
              {currentIdx + 1 < words.length ? "Next" : "Finish"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
