"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Check,
  X,
  Lightbulb,
  Award,
  BookOpen,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { AlgerianCycle } from "./types";

interface SpellingWord {
  word: string;
  definition: string;
}

const WORDS_BY_CYCLE: Record<AlgerianCycle, SpellingWord[]> = {
  primaire: [
    { word: "apple", definition: "A round fruit with red, green, or yellow skin" },
    { word: "book", definition: "A set of written pages bound together for reading" },
    { word: "cat", definition: "A small furry pet that purrs" },
    { word: "dog", definition: "A loyal pet that barks" },
    { word: "fish", definition: "An animal that lives in water" },
    { word: "tree", definition: "A tall plant with a trunk, branches, and leaves" },
    { word: "water", definition: "A clear liquid that we drink" },
    { word: "sun", definition: "The bright star that gives light during the day" },
    { word: "moon", definition: "The round object we see in the sky at night" },
    { word: "star", definition: "A bright point of light in the night sky" }
  ],
  moyen: [
    { word: "mountain", definition: "A very tall natural landform that rises high above the ground" },
    { word: "river", definition: "A large natural stream of water that flows across land" },
    { word: "science", definition: "The study of the natural world through experiments" },
    { word: "history", definition: "The study of past events and civilizations" },
    { word: "energy", definition: "The ability to do work or cause change" },
    { word: "planet", definition: "A large celestial body that orbits a star" },
    { word: "animal", definition: "A living organism that moves, breathes, and feels" },
    { word: "plant", definition: "A living thing that grows in soil and uses sunlight" },
    { word: "number", definition: "A mathematical value used for counting" },
    { word: "bridge", definition: "A structure built to cross over obstacles like rivers" }
  ],
  lycee: [
    { word: "photosynthesis", definition: "The process by which plants convert sunlight into energy" },
    { word: "democracy", definition: "A system of government where citizens choose their leaders" },
    { word: "evolution", definition: "The process of gradual change in species over generations" },
    { word: "ecosystem", definition: "A community of living organisms interacting with their environment" },
    { word: "molecule", definition: "The smallest unit of a chemical compound" },
    { word: "algorithm", definition: "A step-by-step procedure for solving a problem" },
    { word: "equilibrium", definition: "A state of balance between opposing forces or processes" },
    { word: "civilization", definition: "A complex human society with culture and organization" },
    { word: "philosophy", definition: "The study of fundamental questions about existence and knowledge" },
    { word: "hypothesis", definition: "A proposed explanation made as a starting point for investigation" }
  ]
};

export default function SpellingBeeGame({
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
  const words = useMemo(() => WORDS_BY_CYCLE[cycle], [cycle]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [retries, setRetries] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIdx];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIdx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished || revealed) return;

    const val = input.trim().toLowerCase();
    if (!val) return;

    if (val === currentWord.word.toLowerCase()) {
      const points = hintUsed ? 15 : 20;
      setScore((p) => p + points);
      setFeedback("correct");

      setTimeout(() => {
        setFeedback(null);
        goToNext();
      }, 600);
    } else {
      if (retries === 0) {
        setRetries(1);
        setFeedback("wrong");
        setTimeout(() => {
          setFeedback(null);
          setInput("");
          inputRef.current?.focus();
        }, 500);
      } else {
        setRevealed(true);
        setFeedback("wrong");
        setTimeout(() => {
          setFeedback(null);
          goToNext();
        }, 1200);
      }
    }
  };

  const goToNext = () => {
    if (currentIdx + 1 < words.length) {
      setCurrentIdx((p) => p + 1);
      setInput("");
      setShowHint(false);
      setHintUsed(false);
      setRevealed(false);
      setRetries(0);
    } else {
      setIsFinished(true);
      setPointsEarned(score);
      addPoints(score);
    }
  };

  const handleHint = () => {
    if (!hintUsed && !showHint && !revealed) {
      setHintUsed(true);
      setShowHint(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setInput("");
    setScore(0);
    setHintUsed(false);
    setShowHint(false);
    setFeedback(null);
    setRevealed(false);
    setRetries(0);
    setIsFinished(false);
    setPointsEarned(0);
  };

  if (isFinished) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("spelling_congrats") || "Spelling Bee Complete!"}</h4>
          <p className="text-xs text-text-secondary mt-1">Great vocabulary skills! Keep it up.</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>{t("spelling_score") || "Final Score"}</span>
            <span className="font-black" style={{ color: "var(--accent-orange)" }}>{score} / {words.length * 20}</span>
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
            {t("spelling_play_again") || "Play Again"}
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
          {t("spelling_title") || "Spelling Bee"}
        </span>
        <span className="text-xs font-black text-primary">
          {t("spelling_progress") || `${currentIdx + 1}/${words.length}`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1"><BookOpen size={10} /> Word {currentIdx + 1} of {words.length}</span>
          <span>{Math.round(((currentIdx + 1) / words.length) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Score Display */}
      <div className="flex justify-between text-xs font-bold text-text-primary">
        <span className="flex items-center gap-1">
          <Award size={14} className="text-primary" /> {t("spelling_score") || "Score"}: {score}
        </span>
        {hintUsed && (
          <span className="text-[10px] text-amber-500 font-black flex items-center gap-1">
            <Lightbulb size={12} /> {t("spelling_hint_used") || "Hint used (-5)"}
          </span>
        )}
      </div>

      {/* Definition Card */}
      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen size={16} className="text-primary" />
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
            {t("spelling_definition") || "Definition"}
          </span>
        </div>
        <p className="text-sm font-bold text-text-primary leading-relaxed">
          {currentWord.definition}
        </p>
      </div>

      {/* Hint Reveal */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"
        >
          <span className="text-xs font-black text-amber-600">
            {t("spelling_hint_prefix") || "First letter"}: <span className="text-lg tracking-widest">{currentWord.word.charAt(0)} _ _ _</span>
          </span>
        </motion.div>
      )}

      {/* Revealed Answer */}
      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center"
        >
          <span className="text-xs font-black text-red-600">
            {t("spelling_answer") || "Answer"}: <span className="text-lg tracking-wide">{currentWord.word}</span>
          </span>
        </motion.div>
      )}

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
              ? (t("spelling_correct") || `Correct! +${hintUsed ? 15 : 20}`)
              : retries === 1
                ? (t("spelling_wrong_retry") || "Wrong! One more try...")
                : (t("spelling_wrong_reveal") || "Wrong! Showing answer...")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("spelling_input_placeholder") || "Type the word..."}
          disabled={revealed}
          className="flex-1 py-3 px-4 rounded-xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all disabled:opacity-40"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || revealed}
          className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all disabled:opacity-40"
        >
          {t("spelling_submit") || "Submit"}
        </button>
      </form>

      {/* Hint Button */}
      <button
        onClick={handleHint}
        disabled={hintUsed || revealed}
        className="w-full py-2.5 rounded-xl text-xs font-black border border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lightbulb size={14} />
        {hintUsed
          ? (t("spelling_hint_already_used") || "Hint already used")
          : (t("spelling_hint_btn") || "Show Hint (-5 pts)")}
      </button>
    </div>
  );
}