"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Trophy, Clock, Check, X, AlertCircle, Sparkles } from "lucide-react";
import type { AlgerianCycle } from "./types";

interface VocabCard {
  id: number;
  text: string;
  pairId: number;
  type: "word" | "translation";
  isFlipped: boolean;
  isMatched: boolean;
}

const WORD_PAIRS: Record<AlgerianCycle, { word: string; translation: string }[]> = {
  primaire: [
    { word: "Apple", translation: "تفاحة" },
    { word: "Book", translation: "كتاب" },
    { word: "Sun", translation: "شمس" },
    { word: "Water", translation: "ماء" },
    { word: "Cat", translation: "قط" },
    { word: "Star", translation: "نجمة" },
  ],
  moyen: [
    { word: "Science", translation: "علم" },
    { word: "Energy", translation: "طاقة" },
    { word: "Mountain", translation: "جبل" },
    { word: "River", translation: "نهر" },
    { word: "Planet", translation: "كوكب" },
    { word: "History", translation: "تاريخ" },
  ],
  lycee: [
    { word: "Photosynthesis", translation: "البناء الضوئي" },
    { word: "Democracy", translation: "ديمقراطية" },
    { word: "Ecosystem", translation: "نظام بيئي" },
    { word: "Evolution", translation: "تطور" },
    { word: "Equilibrium", translation: "توازن" },
    { word: "Civilization", translation: "حضارة" },
  ],
};

export default function VocabMatchGame({
  t,
  onExit,
  addPoints,
  cycle,
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
}) {
  const pairs = WORD_PAIRS[cycle];
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const pendingPoints = useRef<number | null>(null);

  const initGame = () => {
    const deck: VocabCard[] = pairs.flatMap((p, i) => [
      { id: i * 2, text: p.word, pairId: i, type: "word" as const, isFlipped: false, isMatched: false },
      { id: i * 2 + 1, text: p.translation, pairId: i, type: "translation" as const, isFlipped: false, isMatched: false },
    ]).sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setTimeLeft(60);
    setGameOver(null);
  };

  useEffect(() => { initGame(); }, [cycle]);

  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) { setGameOver("lose"); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    if (pendingPoints.current !== null) {
      addPoints(pendingPoints.current);
      pendingPoints.current = null;
    }
  }, [gameOver]);

  const handleCardClick = (id: number) => {
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched || selected.length >= 2) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    const next = [...selected, id];
    setSelected(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      const [fid, sid] = next;
      const fc = cards.find(c => c.id === fid)!;
      const sc = cards.find(c => c.id === sid)!;

      if (fc.pairId === sc.pairId && fc.type !== sc.type) {
        setTimeout(() => {
          setCards(prev => {
            const nextCards = prev.map(c =>
              c.id === fid || c.id === sid
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            );
            if (nextCards.every(c => c.isMatched)) {
              pendingPoints.current = 150 + timeLeft;
              setGameOver("win");
            }
            return nextCards;
          });
          setSelected([]);
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === fid || c.id === sid ? { ...c, isFlipped: false } : c
          ));
          setSelected([]);
        }, 1000);
      }
    }
  };

  if (gameOver) {
    const isWin = gameOver === "win";
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        {isWin ? (
          <Trophy style={{ color: 'var(--accent-yellow)' }} className="fill-current animate-bounce" size={60} />
        ) : (
          <AlertCircle className="text-red-500 animate-pulse" size={60} />
        )}
        <div>
          <h4 className="font-black text-xl text-text-primary">{isWin ? "🎉 Congratulations!" : "⏰ Time's Up!"}</h4>
          <p className="text-xs text-text-secondary mt-1">{isWin ? "You matched all word pairs!" : "Try again next time"}</p>
        </div>
        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between"><span>Moves</span><span>{moves}</span></div>
          {isWin && <div className="flex justify-between font-black" style={{ color: 'var(--accent-orange)' }}><span>Points</span><span>+{150 + timeLeft} Pts</span></div>}
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={initGame} className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold">Play Again</button>
          <button onClick={onExit} className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-black">{t("mem_finish_game")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
          <ArrowLeft size={16} /> {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary">Vocab Match</span>
        <span className={`text-xs font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-primary"}`}>{timeLeft}s</span>
      </div>
      <div className="text-center text-[10px] text-text-secondary font-bold">Matches: {cards.filter(c => c.isMatched).length / 2} / {pairs.length} · Moves: {moves}</div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <div key={card.id} onClick={() => handleCardClick(card.id)} className="w-full aspect-square relative perspective-1000 cursor-pointer">
              <div className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 border border-primary/20 flex items-center justify-center backface-hidden shadow-xs">
                  <Sparkles className="text-white/40" size={20} />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-border-custom/30 border-2 border-primary/30 flex items-center justify-center text-sm font-black text-text-primary backface-hidden rotate-y-180 shadow-xs p-1 break-words text-center leading-tight">
                  {card.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
