"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Trophy, Clock, Check, X, AlertCircle, Sparkles, MapPin } from "lucide-react";
import type { AlgerianCycle } from "./types";

interface WilayaCard {
  id: number;
  text: string;
  pairId: number;
  type: "name" | "number";
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_WILAYAS: { number: number; name: string }[] = [
  { number: 1, name: "Adrar" }, { number: 2, name: "Chlef" }, { number: 3, name: "Laghouat" },
  { number: 4, name: "Oum El Bouaghi" }, { number: 5, name: "Batna" }, { number: 6, name: "Béjaïa" },
  { number: 7, name: "Biskra" }, { number: 8, name: "Béchar" }, { number: 9, name: "Blida" },
  { number: 10, name: "Bouira" }, { number: 11, name: "Tamanrasset" }, { number: 12, name: "Tébessa" },
  { number: 13, name: "Tlemcen" }, { number: 14, name: "Tiaret" }, { number: 15, name: "Tizi Ouzou" },
  { number: 16, name: "Alger" }, { number: 17, name: "Djelfa" }, { number: 18, name: "Jijel" },
  { number: 19, name: "Sétif" }, { number: 20, name: "Saïda" },
];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function WilayaMatchGame({
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
  const pickCount = cycle === "primaire" ? 4 : cycle === "moyen" ? 6 : 8;
  const [pairs, setPairs] = useState<{ number: number; name: string }[]>([]);
  const [cards, setCards] = useState<WilayaCard[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const pendingPoints = useRef<number | null>(null);

  const initGame = () => {
    const selectedWilayas = shuffleArray(ALL_WILAYAS).slice(0, pickCount);
    setPairs(selectedWilayas);
    const deck: WilayaCard[] = selectedWilayas.flatMap((w, i) => [
      { id: i * 2, text: w.name, pairId: i, type: "name" as const, isFlipped: false, isMatched: false },
      { id: i * 2 + 1, text: `Wilaya ${w.number}`, pairId: i, type: "number" as const, isFlipped: false, isMatched: false },
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
              c.id === fid || c.id === sid ? { ...c, isMatched: true, isFlipped: true } : c
            );
            if (nextCards.every(c => c.isMatched)) {
              pendingPoints.current = pickCount * 25 + timeLeft;
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
          <MapPin style={{ color: 'var(--accent-yellow)' }} className="fill-current animate-bounce" size={60} />
        ) : (
          <AlertCircle className="text-red-500 animate-pulse" size={60} />
        )}
        <div>
          <h4 className="font-black text-xl text-text-primary">{isWin ? "🎉 Algerian Geography Master!" : "⏰ Time's Up!"}</h4>
          <p className="text-xs text-text-secondary mt-1">{isWin ? "You matched all wilayas!" : "Try again to learn the wilayas"}</p>
        </div>
        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between"><span>Moves</span><span>{moves}</span></div>
          {isWin && <div className="flex justify-between font-black" style={{ color: 'var(--accent-orange)' }}><span>Points</span><span>+{pickCount * 25 + timeLeft} Pts</span></div>}
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={initGame} className="flex-1 bg-border-custom hover:bg-border-custom/80 text-text-primary py-3 rounded-xl text-xs font-bold">Play Again</button>
          <button onClick={onExit} className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-black">{t("mem_finish_game")}</button>
        </div>
      </div>
    );
  }

  const cols = pickCount <= 4 ? "grid-cols-4" : pickCount <= 6 ? "grid-cols-4" : "grid-cols-4";

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-border-custom">
        <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
          <ArrowLeft size={16} /> {t("mem_back")}
        </button>
        <span className="text-xs font-black text-text-primary">Wilaya Match</span>
        <span className={`text-xs font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-primary"}`}>{timeLeft}s</span>
      </div>
      <div className="text-center text-[10px] text-text-secondary font-bold">Matches: {cards.filter(c => c.isMatched).length / 2} / {pickCount} · Moves: {moves}</div>

      <div className={`grid ${cols} gap-2`}>
        {cards.map(card => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <div key={card.id} onClick={() => handleCardClick(card.id)} className="w-full aspect-square relative perspective-1000 cursor-pointer">
              <div className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/20 flex items-center justify-center backface-hidden shadow-xs">
                  <MapPin className="text-white/40" size={20} />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-border-custom/30 border-2 border-amber-400/30 flex items-center justify-center text-xs font-black text-text-primary backface-hidden rotate-y-180 shadow-xs p-1 break-words text-center leading-tight">
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
