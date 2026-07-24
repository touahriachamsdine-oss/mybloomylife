"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trophy, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { MemoryCard, AlgerianCycle, GameConfig } from "./types";

export default function MemoryMatchingGame({
  t,
  onExit,
  addPoints,
  cycle,
  customEmojis,
  customTitle
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onExit: () => void;
  addPoints: (pts: number) => void;
  cycle: AlgerianCycle;
  customEmojis?: string[];
  customTitle?: string;
}) {
  const getGameConfig = () => {
    if (customEmojis && customEmojis.length > 0) {
      const len = customEmojis.length;
      let gridCols = "grid-cols-4";
      if (len <= 6) gridCols = "grid-cols-3";
      else if (len <= 8) gridCols = "grid-cols-4";
      else gridCols = "grid-cols-5";
      return {
        emojis: customEmojis,
        gridCols,
        timeLeft: 45,
        pointsPerWin: len * 20
      };
    }
    switch (cycle) {
      case "primaire":
        return {
          emojis: ["🐶", "🐱", "🦊", "🐻", "🦁", "🐯"],
          gridCols: "grid-cols-3",
          timeLeft: 50,
          pointsPerWin: 120
        };
      case "lycee":
        return {
          emojis: ["🧬", "🚀", "💻", "📊", "⚖️", "🏛️", "🌍", "🛰️", "⚙️", "🧪"],
          gridCols: "grid-cols-5",
          timeLeft: 40,
          pointsPerWin: 200
        };
      case "moyen":
      default:
        return {
          emojis: ["📐", "🧪", "🔬", "💻", "📚", "🎨", "⚽", "🧠"],
          gridCols: "grid-cols-4",
          timeLeft: 45,
          pointsPerWin: 150
        };
    }
  };

  const config = getGameConfig();

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLeft);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);

  // Initialize deck
  const initGame = () => {
    const deck = [...config.emojis, ...config.emojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelectedCards([]);
    setMoves(0);
    setTimeLeft(config.timeLeft);
    setGameOver(null);
  };

  useEffect(() => {
    initGame();
  }, [cycle]);

  // Timer loop
  useEffect(() => {
    if (gameOver) return;

    if (timeLeft <= 0) {
      setGameOver("lose");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  // Ref to hold points to award
  const pendingPoints = useRef<number | null>(null);

  // Safely call addPoints outside of the render/setState cycle
  useEffect(() => {
    if (pendingPoints.current !== null) {
      addPoints(pendingPoints.current);
      pendingPoints.current = null;
    }
  }, [gameOver]);

  // Card select handling
  const handleCardClick = (id: number) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    // Flip card
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    const nextSelected = [...selectedCards, id];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = nextSelected;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            const next = prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            );
            // Check win condition purely on data
            const allMatched = next.every((c) => c.isMatched);
            if (allMatched) {
              pendingPoints.current = config.pointsPerWin + timeLeft;
              setGameOver("win");
            }
            return next;
          });
          setSelectedCards([]);
        }, 600);
      } else {
        // Mismatch - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
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
          <h4 className="font-black text-xl text-text-primary">
            {isWin ? t("mem_victory") : t("mem_timeout")}
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            {isWin ? t("mem_victory_desc") : t("mem_timeout_desc")}
          </p>
        </div>

        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between">
            <span>Moves Made</span>
            <span>{moves}</span>
          </div>
          {isWin && (
            <div className="flex justify-between font-black" style={{ color: 'var(--accent-orange)' }}>
              <span>Points Awarded</span>
              <span>+{config.pointsPerWin + timeLeft} Pts</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={initGame}
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
      <div className="flex flex-col gap-1 pb-2 border-b border-border-custom">
        <div className="flex justify-between items-center">
          <button onClick={onExit} className="p-1 rounded-lg hover:bg-border-custom/50 text-text-secondary flex items-center gap-1 text-xs font-black">
            <ArrowLeft size={16} />
            {t("mem_back")}
          </button>
          <span className="text-xs font-black text-text-primary uppercase tracking-wide">
            {customTitle || t("mem_title")}
          </span>
          <span className={`text-xs font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-primary"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="text-[10px] text-text-secondary text-center">Moves: {moves}</div>
      </div>

      {/* Card Grid */}
      <div className={`grid ${config.gridCols} gap-3 my-2 justify-center`}>
        {cards.map((card) => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="w-full aspect-square relative perspective-1000 cursor-pointer"
            >
              <div
                className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Back side of Card (Hidden) */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 border border-primary/20 flex items-center justify-center backface-hidden shadow-xs">
                  <Sparkles className="text-white/40" size={24} />
                </div>
                {/* Front side of Card (Revealed Emoji) */}
                <div className="absolute inset-0 rounded-2xl bg-border-custom/30 dark:bg-zinc-800 border-2 border-primary/30 flex items-center justify-center text-3xl backface-hidden rotate-y-180 shadow-xs">
                  {card.emoji}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
