"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Trophy,
  Clock,
  Star
} from "lucide-react";
import { AlgerianCycle, QuizQuestion } from "./types";

interface IslamicQuizQuestion extends QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUESTIONS_BY_CYCLE: Record<AlgerianCycle, Record<string, IslamicQuizQuestion[]>> = {
  primaire: {
    en: [
      { question: "How many pillars of Islam are there?", options: ["3", "5", "7", "10"], correctIndex: 1 },
      { question: "Which month is Ramadan?", options: ["1st", "9th", "12th", "7th"], correctIndex: 1 },
      { question: "What is the first Surah of Quran?", options: ["Al-Fatiha", "Al-Baqara", "An-Nas", "Al-Ikhlas"], correctIndex: 0 },
    ],
    ar: [
      { question: "كم عدد أركان الإسلام؟", options: ["3", "5", "7", "10"], correctIndex: 1 },
      { question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟", options: ["الأول", "التاسع", "الثاني عشر", "السابع"], correctIndex: 1 },
      { question: "ما هي أول سورة في القرآن؟", options: ["الفاتحة", "البقرة", "الناس", "الإخلاص"], correctIndex: 0 },
    ],
    fr: [
      { question: "Combien y a-t-il de piliers de l'Islam ?", options: ["3", "5", "7", "10"], correctIndex: 1 },
      { question: "Quel est le mois de Ramadan ?", options: ["1er", "9e", "12e", "7e"], correctIndex: 1 },
      { question: "Quelle est la première sourate du Coran ?", options: ["Al-Fatiha", "Al-Baqara", "An-Nas", "Al-Ikhlas"], correctIndex: 0 },
    ],
    kab: [
      { question: "Acḥal n tejra i Lislam?", options: ["3", "5", "7", "10"], correctIndex: 1 },
      { question: "Anwa aggur i d Ramadan?", options: ["1", "9", "12", "7"], correctIndex: 1 },
      { question: "Anwa tasuṛt tamezwarut di Leqran?", options: ["Al-Fatiha", "Al-Baqara", "An-Nas", "Al-Ikhlas"], correctIndex: 0 },
    ]
  },
  moyen: {
    en: [
      { question: "How many times do Muslims pray daily?", options: ["3", "5", "7", "4"], correctIndex: 1 },
      { question: "Which prophet built the Kaaba?", options: ["Moses", "Abraham", "Muhammad", "Noah"], correctIndex: 1 },
      { question: "What is Zakat?", options: ["Fasting", "Charity", "Prayer", "Pilgrimage"], correctIndex: 1 },
    ],
    ar: [
      { question: "كم مرة يصلي المسلم يومياً؟", options: ["3", "5", "7", "4"], correctIndex: 1 },
      { question: "أي نبي بنى الكعبة؟", options: ["موسى", "إبراهيم", "محمد", "نوح"], correctIndex: 1 },
      { question: "ما هي الزكاة؟", options: ["الصوم", "الصدقة", "الصلاة", "الحج"], correctIndex: 1 },
    ],
    fr: [
      { question: "Combien de fois les musulmans prient-ils par jour ?", options: ["3", "5", "7", "4"], correctIndex: 1 },
      { question: "Quel prophète a construit la Kaaba ?", options: ["Moïse", "Abraham", "Mouhammed", "Noé"], correctIndex: 1 },
      { question: "Qu'est-ce que la Zakat ?", options: ["Le jeûne", "L'aumône", "La prière", "Le pèlerinage"], correctIndex: 1 },
    ],
    kab: [
      { question: "Acḥal n tikkal i yzennuzu Imuslimen ass?", options: ["3", "5", "7", "4"], correctIndex: 1 },
      { question: "Anwa nnbi i yebna Lkaaba?", options: ["Musa", "Ibrahime", "Mouhammed", "Nouh"], correctIndex: 1 },
      { question: "D acu t Zakat?", options: ["Tawrit", "Aseddeq", "Tazallit", "Lḥejj"], correctIndex: 1 },
    ]
  },
  lycee: {
    en: [
      { question: "In which year did the Hijra occur?", options: ["610 CE", "622 CE", "632 CE", "570 CE"], correctIndex: 1 },
      { question: "What is the 5th pillar of Islam?", options: ["Salah", "Zakat", "Hajj", "Sawm"], correctIndex: 2 },
      { question: "How many verses are in the Quran?", options: ["6236", "6348", "6666", "6000"], correctIndex: 0 },
    ],
    ar: [
      { question: "في أي سنة وقعت الهجرة؟", options: ["610 م", "622 م", "632 م", "570 م"], correctIndex: 1 },
      { question: "ما هو الركن الخامس من أركان الإسلام؟", options: ["الصلاة", "الزكاة", "الحج", "الصوم"], correctIndex: 2 },
      { question: "كم عدد آيات القرآن الكريم؟", options: ["6236", "6348", "6666", "6000"], correctIndex: 0 },
    ],
    fr: [
      { question: "En quelle année l'Hégire a-t-elle eu lieu ?", options: ["610 EC", "622 EC", "632 EC", "570 EC"], correctIndex: 1 },
      { question: "Quel est le 5e pilier de l'Islam ?", options: ["Salah", "Zakat", "Hajj", "Sawm"], correctIndex: 2 },
      { question: "Combien de versets y a-t-il dans le Coran ?", options: ["6236", "6348", "6666", "6000"], correctIndex: 0 },
    ],
    kab: [
      { question: "Deg anwa assegwas i d-yekka Lhijra?", options: ["610 EC", "622 EC", "632 EC", "570 EC"], correctIndex: 1 },
      { question: "D acu i d arrig wis 5 n Lislam?", options: ["Tazallit", "Zakat", "Lḥejj", "Tawrit"], correctIndex: 2 },
      { question: "Acḥal n tmassinin i Leqran?", options: ["6236", "6348", "6666", "6000"], correctIndex: 0 },
    ]
  }
};

export default function IslamicQuizGame({
  t,
  onExit,
  addPoints,
  cycle,
  appLanguage
}: {
  t: (k: string, ...a: any[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
  appLanguage?: string;
}) {
  const lang = appLanguage || "en";
  const questions = useMemo(() => QUESTIONS_BY_CYCLE[cycle]?.[lang] || QUESTIONS_BY_CYCLE[cycle]?.en || [], [cycle, lang]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const activeQuestion = questions[currentIdx];

  const handleOptionSelect = (index: number) => {
    setSelectedIdx(index);
    if (index === activeQuestion.correctIndex) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleOptionSelectRef = useRef(handleOptionSelect);
  handleOptionSelectRef.current = handleOptionSelect;

  useEffect(() => {
    if (isFinished || selectedIdx !== null) return;
    if (timeLeft <= 0) {
      handleOptionSelectRef.current(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, currentIdx, selectedIdx, isFinished]);

  const handleNext = () => {
    setSelectedIdx(null);
    setTimeLeft(15);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
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
        <Star style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("islamic_congrats") || "Islamic Quiz Complete!"}</h4>
          <p className="text-xs text-text-secondary mt-1">{t("quiz_finished_desc")}</p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-text-primary">
            <span>{t("quiz_correct_count", correctAnswers, questions.length)}</span>
            <span>{Math.round((correctAnswers / questions.length) * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs font-black" style={{ color: "var(--accent-orange)" }}>
            <span>{t("quiz_points") || "Points Earned"}</span>
            <span>+{totalPointsEarned} Pts</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold transition-all"
          >
            {t("quiz_play_again") || "Play Again"}
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
          {t("islamic_title") || "Islamic Quiz"}
        </span>
        <span className="text-xs font-black text-primary">
          {t("quiz_progress", currentIdx + 1, questions.length)}
        </span>
      </div>

      {/* Timer Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-black text-text-secondary">
          <span className="flex items-center gap-1"><Clock size={10} /> Timer</span>
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
          {currentIdx + 1 === questions.length ? t("quiz_view_result") : t("quiz_next_question")}
        </button>
      )}
    </div>
  );
}
