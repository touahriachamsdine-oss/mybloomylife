"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { useBloom } from "@/context/BloomContext";

const PRESETS = [15, 25, 45] as const;
const POINTS_PER_SESSION = 50;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function FocusTimerCard({ t }: { t: (k: string, ...a: (string | number)[]) => string }) {
  const { addPoints } = useBloom();
  const [minutes, setMinutes] = useState<number>(25);
  const [remaining, setRemaining] = useState<number>(25 * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [finishedMinutes, setFinishedMinutes] = useState<number | null>(null);

  // The provider rebuilds its value object on every render, so addPoints has a
  // new identity each time. Holding it in a ref keeps the interval effect from
  // being torn down and restarted on every render.
  const addPointsRef = useRef(addPoints);
  useEffect(() => {
    addPointsRef.current = addPoints;
  }, [addPoints]);

  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = remainingRef.current - 1;
      if (next <= 0) {
        remainingRef.current = 0;
        setRemaining(0);
        setRunning(false);
        setFinishedMinutes(minutes);
        addPointsRef.current(POINTS_PER_SESSION);
      } else {
        remainingRef.current = next;
        setRemaining(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, minutes]);

  const selectPreset = (mins: number) => {
    setMinutes(mins);
    setRemaining(mins * 60);
    setRunning(false);
    setFinishedMinutes(null);
  };

  const reset = () => {
    setRemaining(minutes * 60);
    setRunning(false);
    setFinishedMinutes(null);
  };

  const total = minutes * 60;
  const progress = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;
  // "Start" on a fresh or finished session, "Resume" when paused mid-session.
  const isFresh = finishedMinutes !== null || remaining === total;
  const primaryLabel = running
    ? t("focus_timer_pause")
    : isFresh
      ? t("focus_timer_start")
      : t("focus_timer_resume");

  return (
    <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-black text-text-primary flex items-center gap-1.5">
          <TimerIcon size={15} className="text-primary" /> {t("focus_timer_title")}
        </h2>
        <p className="text-[11px] text-text-secondary">{t("focus_timer_subtitle")}</p>
      </div>

      <div className="flex items-center justify-center py-1">
        <span
          className={`text-4xl font-black tabular-nums tracking-tight ${
            running ? "text-primary" : "text-text-primary"
          }`}
          dir="ltr"
        >
          {formatClock(remaining)}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-border-custom/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-2">
        {PRESETS.map((mins) => (
          <button
            type="button"
            key={mins}
            onClick={() => selectPreset(mins)}
            disabled={running}
            className={`flex-1 py-2 rounded-xl text-[11px] font-black border transition-all disabled:opacity-40 ${
              minutes === mins
                ? "bg-primary text-white border-primary"
                : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20"
            }`}
          >
            {t(
              mins === 15 ? "focus_timer_short" : mins === 25 ? "focus_timer_medium" : "focus_timer_long"
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (finishedMinutes !== null) reset();
            setRunning((r) => !r);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-xs font-black shadow-xs hover:opacity-90 transition-all"
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border-custom text-xs font-black text-text-primary hover:bg-border-custom/20 transition-all"
        >
          <RotateCcw size={14} /> {t("focus_timer_reset")}
        </button>
      </div>

      {finishedMinutes !== null && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
          <span className="text-xs font-black text-emerald-600">{t("focus_timer_done_title")}</span>
          <span className="text-[11px] text-text-secondary font-semibold">
            {t("focus_timer_done_body", finishedMinutes)}
          </span>
        </div>
      )}
    </div>
  );
}

export default FocusTimerCard;
