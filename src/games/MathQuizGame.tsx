"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trophy, ArrowLeft, Clock, Check, X } from "lucide-react";
import { AlgerianCycle, QuizQuestion } from "./types";

export default function MathQuizGame({
  t,
  onExit,
  addPoints,
  cycle,
  appLanguage,
  customQuestions,
  customTitle
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
  appLanguage?: string;
  customQuestions?: QuizQuestion[];
  customTitle?: string;
}) {
  const getQuestionsForLevel = (): QuizQuestion[] => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions;
    }
    if (cycle === "primaire") {
      if (appLanguage === "ar") {
        return [
          { question: "ما هي نتيجة: 8 + 6؟", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "إذا كان لدى سارة 15 حبة تمر وأكلت 4، فكم حبة بقيت لديها؟", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "ما هو حاصل ضرب: 9 × 3؟", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Combien font : 8 + 6 ?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "Si Sara a 15 dattes et en mange 4, combien lui en reste-t-il ?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "Combien font : 9 × 3 ?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Acḥal i d-yettak: 8 + 6?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "Ma yella ɣur Sara 15 n ttejratin tččer 4, acḥal i s-d-yeqqimen?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "Acḥal i d-yettak: 9 × 3?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "What is 8 + 6?", options: ["12", "14", "15", "16"], correctIndex: 1 },
          { question: "If Sara has 15 dates and eats 4, how many dates does she have left?", options: ["9", "10", "11", "12"], correctIndex: 2 },
          { question: "What is 9 × 3?", options: ["24", "27", "28", "30"], correctIndex: 1 }
        ];
      }
    } else if (cycle === "lycee") {
      if (appLanguage === "ar") {
        return [
          { question: "أوجد مشتق الدالة f(x) = x² + 3x عند x = 2:", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "ما هي قيمة log2(32)؟", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "أوجد حلول المعادلة: x² - 5x + 6 = 0:", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Trouvez la dérivée de f(x) = x² + 3x pour x = 2 :", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "Quelle est la valeur de log2(32) ?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Résoudre l'équation : x² - 5x + 6 = 0 :", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Af-d derivé n f(x) = x² + 3x deg x = 2 :", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "Acḥal i d azal n log2(32)?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Fru taseddart: x² - 5x + 6 = 0 :", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "Find the derivative of f(x) = x² + 3x at x = 2:", options: ["5", "7", "6", "8"], correctIndex: 1 },
          { question: "What is the value of log2(32)?", options: ["4", "5", "6", "16"], correctIndex: 1 },
          { question: "Solve the equation: x² - 5x + 6 = 0:", options: ["x=1, x=6", "x=2, x=3", "x=-2, x=-3", "x=5, x=1"], correctIndex: 1 }
        ];
      }
    } else {
      if (appLanguage === "ar") {
        return [
          { question: "حل المعادلة:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "ما هو مجموع قياسات زوايا المثلث؟", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "ما هي نتيجة: 3/4 + 1/2؟", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "fr") {
        return [
          { question: "Résoudre l'équation :\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "Quelle est la somme des angles d'un triangle ?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "Quelle est la valeur de : 3/4 + 1/2 ?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else if (appLanguage === "kab") {
        return [
          { question: "Fru taseddart:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "Acḥal i d timrirt n tɣemrin n lmutellaṯ?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "Acḥal i d-yettak: 3/4 + 1/2?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      } else {
        return [
          { question: "Solve the equation:\n2x + 5 = 15", options: ["3", "5", "8", "10"], correctIndex: 1 },
          { question: "What is the sum of the interior angles of a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
          { question: "What is the value of: 3/4 + 1/2?", options: ["4/6", "5/4", "3/8", "1"], correctIndex: 1 }
        ];
      }
    }
  };

  const quizQuestions = getQuestionsForLevel();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  const activeQuestion = quizQuestions[currentIdx];

  const handleOptionSelect = (index: number) => {
    setSelectedIdx(index);
    if (index === activeQuestion.correctIndex) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleOptionSelectRef = useRef(handleOptionSelect);
  handleOptionSelectRef.current = handleOptionSelect;

  // Question Timer Loop
  useEffect(() => {
    if (isFinished || selectedIdx !== null) return;

    if (timeLeft <= 0) {
      handleOptionSelectRef.current(-1);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, currentIdx, selectedIdx, isFinished]);

  const handleNext = () => {
    setSelectedIdx(null);
    setTimeLeft(15);
    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      // Award 50 points per correct answer
      addPoints(correctAnswers * 50);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setCorrectAnswers(0);
    setIsFinished(false);
    setTimeLeft(15);
  };

  if (isFinished) {
    const totalPointsEarned = correctAnswers * 50;
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: 'var(--accent-yellow)' }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("quiz_congrats")}</h4>
          <p className="text-xs text-text-secondary mt-1">{t("quiz_finished_desc")}</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-text-primary">
            <span>{t("quiz_correct_count", correctAnswers, quizQuestions.length)}</span>
            <span>{Math.round((correctAnswers / quizQuestions.length) * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs font-black" style={{ color: 'var(--accent-orange)' }}>
            <span>Points Earned</span>
            <span>+{totalPointsEarned} Pts</span>
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
        <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
          <ArrowLeft size={16} />
          {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary uppercase tracking-wide">
          {customTitle || t("game_math_challenge")}
        </span>
        <span className="text-xs font-black text-primary">
          {t("quiz_progress", currentIdx + 1, quizQuestions.length)}
        </span>
      </div>

      {/* Timer Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock size={10} /> Timer
          </span>
          <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-4 rounded-2xl bg-border-custom/20 border border-border-custom/30 text-center py-6">
        <p className="text-sm font-black text-text-primary whitespace-pre-line leading-relaxed">
          {activeQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {activeQuestion.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === activeQuestion.correctIndex;
          const showAnswer = selectedIdx !== null;

          let btnClass = "border-border-custom bg-surface text-text-primary hover:bg-border-custom/20";
          if (showAnswer) {
            if (isCorrect) {
              btnClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-black";
            } else if (isSelected) {
              btnClass = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 font-black";
            } else {
              btnClass = "border-border-custom opacity-50 bg-surface text-text-secondary";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={showAnswer}
              className={`w-full py-3.5 px-4 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${btnClass}`}
            >
              <span>{opt}</span>
              {showAnswer && isCorrect && <Check size={14} className="text-green-500" />}
              {showAnswer && isSelected && !isCorrect && <X size={14} className="text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Navigation action */}
      {selectedIdx !== null && (
        <button
          onClick={handleNext}
          className="w-full bg-primary text-white py-3.5 rounded-xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all mt-2"
        >
          {currentIdx + 1 === quizQuestions.length ? t("quiz_view_result") : t("quiz_next_question")}
        </button>
      )}
    </div>
  );
}
