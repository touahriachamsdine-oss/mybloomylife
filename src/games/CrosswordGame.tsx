"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Check, X, RefreshCw, Sparkles } from "lucide-react";
import { AlgerianCycle } from "./types";

interface CrosswordPuzzle {
  grid: string[][];
  across: { number: number; clue: string; startRow: number; startCol: number; length: number }[];
  down: { number: number; clue: string; startRow: number; startCol: number; length: number }[];
}

const PUZZLES: Record<AlgerianCycle, CrosswordPuzzle> = {
  primaire: {
    grid: [
      ["C", "A", "T"],
      ["O", "#", "#"],
      ["W", "#", "#"],
    ],
    across: [
      { number: 1, clue: "A furry pet that purrs", startRow: 0, startCol: 0, length: 3 },
    ],
    down: [
      { number: 2, clue: "A farm animal that gives milk", startRow: 0, startCol: 0, length: 3 },
    ],
  },
  moyen: {
    grid: [
      ["M", "A", "T", "H"],
      ["U", "#", "#", "#"],
      ["S", "#", "#", "#"],
      ["E", "#", "#", "#"],
    ],
    across: [
      { number: 1, clue: "Study of numbers and shapes", startRow: 0, startCol: 0, length: 4 },
    ],
    down: [
      { number: 2, clue: "A source of artistic inspiration", startRow: 0, startCol: 0, length: 4 },
    ],
  },
  lycee: {
    grid: [
      ["C", "L", "O", "C", "K"],
      ["E", "#", "#", "#", "#"],
      ["L", "#", "#", "#", "#"],
      ["L", "#", "#", "#", "#"],
      ["S", "#", "#", "#", "#"],
    ],
    across: [
      { number: 1, clue: "A device that tells time", startRow: 0, startCol: 0, length: 5 },
    ],
    down: [
      { number: 2, clue: "Basic structural unit of life", startRow: 0, startCol: 0, length: 5 },
    ],
  },
};

export default function CrosswordGame({
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
  const puzzle = PUZZLES[cycle];
  const rows = puzzle.grid.length;
  const cols = puzzle.grid[0].length;

  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const [scoreAwarded, setScoreAwarded] = useState(false);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());

  const isBlocked = (r: number, c: number) => puzzle.grid[r][c] === "#";
  const cellKey = (r: number, c: number) => `${r},${c}`;

  const letterAt = (r: number, c: number) => puzzle.grid[r][c];

  const handleCellChange = (r: number, c: number, val: string) => {
    if (checked) return;
    const key = cellKey(r, c);
    setCellValues((prev) => ({
      ...prev,
      [key]: val.toUpperCase().slice(0, 1),
    }));
  };

  const handleCheck = () => {
    const wrong = new Set<string>();
    const correct = new Set<string>();
    let allGood = true;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (isBlocked(r, c)) continue;
        const key = cellKey(r, c);
        const val = cellValues[key] || "";
        if (val === letterAt(r, c)) {
          correct.add(key);
        } else {
          wrong.add(key);
          allGood = false;
        }
      }
    }

    setWrongCells(wrong);
    setCorrectCells(correct);
    setChecked(true);

    if (allGood && !scoreAwarded) {
      setAllCorrect(true);
      setScoreAwarded(true);
      const pts = cycle === "primaire" ? 50 : cycle === "moyen" ? 80 : 120;
      addPoints(pts);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (checked) return;
  };

  const allFilled = () => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (isBlocked(r, c)) continue;
        const key = cellKey(r, c);
        if (!cellValues[key]) return false;
      }
    }
    return true;
  };

  const getPointsForCycle = () => {
    return cycle === "primaire" ? 50 : cycle === "moyen" ? 80 : 120;
  };

  if (allCorrect) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-5 text-center">
        <Trophy style={{ color: "var(--accent-yellow)" }} className="fill-current animate-bounce" size={60} />
        <div>
          <h4 className="font-black text-xl text-text-primary">{t("quiz_congrats")}</h4>
          <p className="text-xs text-text-secondary mt-1">All words completed correctly!</p>
        </div>
        <div className="w-full bg-border-custom/20 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold text-text-primary">
          <div className="flex justify-between font-black" style={{ color: "var(--accent-orange)" }}>
            <span>Points Earned</span>
            <span>+{getPointsForCycle()} Pts</span>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              setCellValues({});
              setChecked(false);
              setAllCorrect(false);
              setScoreAwarded(false);
              setWrongCells(new Set());
              setCorrectCells(new Set());
            }}
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
        <span className="text-xs font-black text-text-primary uppercase tracking-wide">
          Crossword
        </span>
        <span className="text-xs font-black text-primary">
          {cycle}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const blocked = isBlocked(r, c);
              const key = cellKey(r, c);
              const val = cellValues[key] || "";
              const isWrong = checked && wrongCells.has(key);
              const isCorrect = checked && correctCells.has(key);

              return (
                <div
                  key={key}
                  className="relative"
                >
                  {blocked ? (
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-border-custom/60 rounded-lg" />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      onClick={() => handleCellClick(r, c)}
                      maxLength={1}
                      disabled={checked}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-lg text-center text-sm font-black uppercase outline-none transition-all border-2 ${
                        checked
                          ? isCorrect
                            ? "border-green-500 bg-green-500/10 text-green-600"
                            : isWrong
                            ? "border-red-500 bg-red-500/10 text-red-500"
                            : "border-border-custom bg-surface text-text-primary"
                          : val
                          ? "border-primary bg-primary/5 text-text-primary"
                          : "border-border-custom bg-surface text-text-primary hover:border-primary/50"
                      }`}
                    />
                  )}
                  {puzzle.across.some(
                    (a) => a.startRow === r && a.startCol === c
                  ) && (
                    <span className="absolute -top-2 -left-1 text-[8px] font-black text-text-secondary pointer-events-none">
                      {puzzle.across.find(
                        (a) => a.startRow === r && a.startCol === c
                      )?.number}
                    </span>
                  )}
                  {puzzle.down.some(
                    (d) => d.startRow === r && d.startCol === c && !puzzle.across.some(
                      (a) => a.startRow === r && a.startCol === c
                    )
                  ) && (
                    <span className="absolute -top-2 -left-1 text-[8px] font-black text-text-secondary pointer-events-none">
                      {puzzle.down.find(
                        (d) => d.startRow === r && d.startCol === c
                      )?.number}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-border-custom/10 rounded-2xl p-3 border border-border-custom/30">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Across</p>
        {puzzle.across.map((a) => (
          <p key={`across-${a.number}`} className="text-xs font-bold text-text-primary">
            <span className="text-primary font-black mr-1">{a.number}.</span>
            {a.clue}
            <span className="text-text-secondary ml-1">({a.length})</span>
          </p>
        ))}
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider mt-1">Down</p>
        {puzzle.down.map((d) => (
          <p key={`down-${d.number}`} className="text-xs font-bold text-text-primary">
            <span className="text-primary font-black mr-1">{d.number}.</span>
            {d.clue}
            <span className="text-text-secondary ml-1">({d.length})</span>
          </p>
        ))}
      </div>

      <button
        onClick={handleCheck}
        disabled={!allFilled() || checked}
        className="w-full bg-primary hover:bg-primary/95 disabled:opacity-30 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2"
      >
        <Check size={16} />
        Check Answers
      </button>
    </div>
  );
}
