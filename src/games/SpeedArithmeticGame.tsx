"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Zap,
  Award,
  Sparkles,
  Check,
  X,
  Flame,
  Timer
} from "lucide-react";
import { AlgerianCycle } from "./types";

type Operator = "+" | "-" | "×";

interface Problem {
  a: number;
  b: number;
  op: Operator;
  answer: number;
}

function generateProblem(cycle: AlgerianCycle): Problem {
  let a: number, b: number, op: Operator;
  const ops: Operator[] = cycle === "primaire" ? ["+", "-"] : ["+", "-", "×"];

  if (cycle === "primaire") {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
  } else if (cycle === "moyen") {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
  } else {
    a = Math.floor(Math.random() * 100) + 1;
    b = Math.floor(Math.random() * 100) + 1;
  }

  op = ops[Math.floor(Math.random() * ops.length)];

  if (op === "-" && b > a) {
    [a, b] = [b, a];
  }

  let answer: number;
  switch (op) {
    case "+": answer = a + b; break;
    case "-": answer = a - b; break;
    case "×": answer = a * b; break;
  }

  return { a, b, op, answer };
}

export default function SpeedArithmeticGame({
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
  const GAME_DURATION = 30;

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(cycle));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [problem]);

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      const earned = totalCorrect * 10;
      setPointsEarned(earned);
      addPoints(earned);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isFinished]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished) return;

    const val = parseInt(input.trim(), 10);
    if (isNaN(val)) return;

    setAttempts((p) => p + 1);

    if (val === problem.answer) {
      setScore((p) => p + 10);
      setTotalCorrect((p) => p + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setFeedback("correct");
      setTimeout(() => {
        setFeedback(null);
        setProblem(generateProblem(cycle));
        setInput("");
      }, 400);
    } else {
      setStreak(0);
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const handleRestart = () => {
    setTimeLeft(GAME_DURATION);
    setProblem(generateProblem(cycle));
    setInput("");
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setAttempts(0);
    setIsFinished(false);
    setFeedback(null);
    setPointsEarned(0);
    inputRef.current?.focus();
  };

  if (isFinished) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("speed_congrats") || "Time&apos;s Up!"}</h4>
          <p className="text-xs text-text-secondary mt-1">Great effort! Here&apos;s your performance summary.</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>Correct Answers</span>
            <span className="font-black text-green-500">{totalCorrect} / {attempts}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Flame size={14} style={{ color: "var(--accent-orange)" }} /> Best Streak
            </span>
            <span className="font-black" style={{ color: "var(--accent-orange)" }}>{bestStreak}x</span>
          </div>
          <div className="flex justify-between font-black" style={{ color: "var(--accent-yellow)" }}>
            <span>Points Earned</span>
            <span>+{pointsEarned} Pts</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            {t("speed_play_again") || "Play Again"}
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
          {t("speed_title") || "Speed Arithmetic"}
        </span>
        <span className="text-xs font-black flex items-center gap-1">
          <Flame size={14} style={{ color: "var(--accent-orange)" }} />
          <span style={{ color: "var(--accent-orange)" }}>{streak}</span>
        </span>
      </div>

      {/* Timer */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1"><Timer size={10} /> Time</span>
          <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          />
        </div>
      </div>

      {/* Score & Streak Row */}
      <div className="flex justify-between text-xs font-bold text-text-primary">
        <span>Score: {score}</span>
        <span className="flex items-center gap-1">
          {streak > 0 && <span>🔥</span>} {t("speed_streak") || "Streak"}: {streak}
        </span>
      </div>

      {/* Problem Display */}
      <div className="p-6 rounded-2xl bg-border-custom/20 border border-border-custom/30 text-center">
        <p className="text-3xl font-black text-text-primary tracking-wide">
          {problem.a} {problem.op} {problem.b} = ?
        </p>
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
            {feedback === "correct" ? "Correct! +10" : "Wrong!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("speed_input_placeholder") || "Type your answer..."}
          className="flex-1 py-3 px-4 rounded-xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all disabled:opacity-40"
        >
          {t("speed_submit") || "Submit"}
        </button>
      </form>

      {/* Quick Stats */}
      <div className="flex justify-between text-[10px] text-text-secondary font-bold">
        <span>{t("speed_correct") || "Correct"}: {totalCorrect}</span>
        <span>{t("speed_best_streak") || "Best Streak"}: {bestStreak}x</span>
      </div>
    </div>
  );
}