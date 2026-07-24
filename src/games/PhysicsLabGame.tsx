"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Trophy,
  Clock,
  Atom,
  Zap,
} from "lucide-react";
import { AlgerianCycle } from "./types";

interface FormulaPair {
  id: number;
  formula: string;
  description: string;
}

const FORMULAS_BY_CYCLE: Record<AlgerianCycle, FormulaPair[]> = {
  primaire: [
    {
      id: 0,
      formula: "Speed = Distance \u00F7 Time",
      description: "Speed equals distance divided by time",
    },
    {
      id: 1,
      formula: "Force = Mass \u00D7 Acceleration",
      description: "Force equals mass times acceleration",
    },
    {
      id: 2,
      formula: "Work = Force \u00D7 Distance",
      description: "Work equals force times distance",
    },
    {
      id: 3,
      formula: "Power = Work \u00F7 Time",
      description: "Power equals work divided by time",
    },
    {
      id: 4,
      formula: "Density = Mass \u00F7 Volume",
      description: "Density equals mass divided by volume",
    },
  ],
  moyen: [
    { id: 0, formula: "v = d/t", description: "Velocity equals distance over time" },
    { id: 1, formula: "F = ma", description: "Force equals mass times acceleration" },
    { id: 2, formula: "W = Fd", description: "Work equals force times distance" },
    { id: 3, formula: "P = W/t", description: "Power equals work over time" },
    { id: 4, formula: "\u03C1 = m/V", description: "Density equals mass over volume" },
  ],
  lycee: [
    {
      id: 0,
      formula: "F = G(m\u2081m\u2082/r\u00B2)",
      description: "Newton's Law of Gravitation",
    },
    { id: 1, formula: "E = mc\u00B2", description: "Einstein's Mass-Energy Equivalence" },
    { id: 2, formula: "PV = nRT", description: "Ideal Gas Law" },
    { id: 3, formula: "V = IR", description: "Ohm's Law" },
    { id: 4, formula: "\u03BB = h/p", description: "de Broglie Wavelength" },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface ShuffledItem {
  id: number;
  text: string;
  matched: boolean;
}

export default function PhysicsLabGame({
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
  const GAME_DURATION = 45;
  const POINTS_PER_MATCH = 20;

  const pairs = useMemo(() => FORMULAS_BY_CYCLE[cycle], [cycle]);
  const totalPairs = pairs.length;

  const initFormulas = (): ShuffledItem[] =>
    shuffle(pairs.map((p) => ({ id: p.id, text: p.formula, matched: false })));
  const initDescriptions = (): ShuffledItem[] =>
    shuffle(pairs.map((p) => ({ id: p.id, text: p.description, matched: false })));

  const [formulaList, setFormulaList] = useState<ShuffledItem[]>(initFormulas);
  const [descList, setDescList] = useState<ShuffledItem[]>(initDescriptions);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(null);
  const [selectedDescId, setSelectedDescId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const matchedCount = formulaList.filter((f) => f.matched).length;
  const isWin = matchedCount === totalPairs;

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      const earned = score;
      setPointsEarned(earned);
      addPoints(earned);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isFinished, score, addPoints]);

  useEffect(() => {
    if (isWin && !isFinished) {
      setIsFinished(true);
      const earned = score;
      setPointsEarned(earned);
      addPoints(earned);
    }
  }, [isWin, isFinished, score, addPoints]);

  const handleFormulaClick = (id: number) => {
    if (isFinished || feedback) return;
    const formula = formulaList.find((f) => f.id === id);
    if (!formula || formula.matched) return;
    setSelectedFormulaId(selectedFormulaId === id ? null : id);
    setSelectedDescId(null);
  };

  const handleDescClick = (id: number) => {
    if (isFinished || feedback || selectedFormulaId === null) return;
    const desc = descList.find((d) => d.id === id);
    if (!desc || desc.matched) return;

    if (selectedFormulaId === id) {
      setFeedback("correct");
      setScore((s) => s + POINTS_PER_MATCH);
      setFormulaList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, matched: true } : f))
      );
      setDescList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, matched: true } : d))
      );
      setTimeout(() => {
        setFeedback(null);
        setSelectedFormulaId(null);
        setSelectedDescId(null);
      }, 600);
    } else {
      setFeedback("wrong");
      setSelectedDescId(id);
      setTimeout(() => {
        setFeedback(null);
        setSelectedFormulaId(null);
        setSelectedDescId(null);
      }, 600);
    }
  };

  const handleRestart = () => {
    setFormulaList(initFormulas());
    setDescList(initDescriptions());
    setSelectedFormulaId(null);
    setSelectedDescId(null);
    setFeedback(null);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsFinished(false);
    setPointsEarned(0);
  };

  if (isFinished) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy
          style={{ color: "var(--accent-yellow)" }}
          className="fill-current animate-bounce"
          size={60}
        />
        <div>
          <h4 className="font-black text-xl text-text-primary">
            {isWin
              ? t("physics_congrats") || "Lab Complete!"
              : t("physics_timeout") || "Time's Up!"}
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            {isWin
              ? "All formulas matched perfectly!"
              : `Matched ${matchedCount} of ${totalPairs} formulas.`}
          </p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>Correct Matches</span>
            <span className="font-black text-green-500">
              {matchedCount} / {totalPairs}
            </span>
          </div>
          <div
            className="flex justify-between font-black"
            style={{ color: "var(--accent-yellow)" }}
          >
            <span>Points Earned</span>
            <span>+{pointsEarned} Pts</span>
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
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button
          onClick={onExit}
          className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black"
        >
          <ArrowLeft size={16} />
          {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary uppercase tracking-wide flex items-center gap-1.5">
          <Atom size={14} className="text-primary" />
          Physics Lab
        </span>
        <span className="text-xs font-black flex items-center gap-1">
          <Zap size={14} style={{ color: "var(--accent-orange)" }} />
          <span style={{ color: "var(--accent-orange)" }}>{score}</span>
        </span>
      </div>

      {/* Timer & Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock size={10} /> Time
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={10} /> {matchedCount}/{totalPairs} matched
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 10 ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black">
          <span className={timeLeft <= 10 ? "text-red-500" : "text-text-secondary"}>
            {timeLeft}s remaining
          </span>
          <span style={{ color: "var(--accent-orange)" }}>+{score} pts</span>
        </div>
      </div>

      {/* Feedback Flash */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black ${
              feedback === "correct"
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {feedback === "correct" ? <Check size={16} /> : <X size={16} />}
            {feedback === "correct"
              ? `+${POINTS_PER_MATCH} Correct!`
              : "Wrong match!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulas Column */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider px-1">
            Formula
          </span>
          <AnimatePresence>
            {formulaList
              .filter((f) => !f.matched)
              .map((f) => {
                const isSelected = selectedFormulaId === f.id;
                return (
                  <motion.button
                    key={f.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    onClick={() => handleFormulaClick(f.id)}
                    className={`w-full py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all overflow-hidden ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-surface text-text-primary border-border-custom hover:bg-border-custom/20"
                    }`}
                  >
                    {f.text}
                  </motion.button>
                );
              })}
          </AnimatePresence>
          {formulaList.filter((f) => !f.matched).length === 0 && (
            <div className="text-xs text-text-secondary text-center py-6 italic font-semibold">
              All matched!
            </div>
          )}
        </div>

        {/* Descriptions Column */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider px-1">
            Description
          </span>
          <AnimatePresence>
            {descList
              .filter((d) => !d.matched)
              .map((d) => {
                const isSelected = selectedDescId === d.id;
                const isWrongFeedback =
                  feedback === "wrong" && selectedDescId === d.id;
                return (
                  <motion.button
                    key={d.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    onClick={() => handleDescClick(d.id)}
                    disabled={selectedFormulaId === null}
                    className={`w-full py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all overflow-hidden ${
                      isWrongFeedback
                        ? "bg-red-500/10 text-red-500 border-red-500/30"
                        : isSelected
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-surface text-text-primary border-border-custom hover:bg-border-custom/20"
                    } ${
                      selectedFormulaId === null ? "opacity-50" : ""
                    }`}
                  >
                    {d.text}
                  </motion.button>
                );
              })}
          </AnimatePresence>
          {descList.filter((d) => !d.matched).length === 0 && (
            <div className="text-xs text-text-secondary text-center py-6 italic font-semibold">
              All matched!
            </div>
          )}
        </div>
      </div>

      {/* Instruction Bar */}
      <div className="text-center text-[10px] text-text-secondary font-bold py-2 border-t border-border-custom/50">
        {selectedFormulaId !== null
          ? "Now tap the matching description"
          : "Tap a formula, then tap its matching description"}
      </div>
    </div>
  );
}
