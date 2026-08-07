"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, GraduationCap, School, Backpack } from "lucide-react";
import { useBloom, AlgerianLevel } from "@/context/BloomContext";

function LevelPickerScreen({
  t,
  studentName,
  onConfirm
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  studentName: string;
  onConfirm: (level: AlgerianLevel) => void;
}) {
  const { algerianLevels } = useBloom();
  // The youth questionnaire covers middle school (الطور المتوسط) and
  // secondary school (الطور الثانوي).
  const questionnaireCycles = algerianLevels.filter(c => c.cycle === "primaire" || c.cycle === "moyen" || c.cycle === "lycee");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | null>(null);
  const [selectedYearIdx, setSelectedYearIdx] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>("");

  const activeCycle = selectedCycleIdx !== null ? questionnaireCycles[selectedCycleIdx] : null;
  const activeYear = activeCycle && selectedYearIdx !== null ? activeCycle.years[selectedYearIdx] : null;
  const needsTrack = !!(activeYear?.tracks && activeYear.tracks.length > 0);
  const canConfirm = activeCycle && activeYear && (!needsTrack || selectedTrack);

  const handleConfirm = () => {
    if (!activeCycle || !activeYear) return;
    const level: AlgerianLevel = {
      cycle: activeCycle.cycle,
      year: activeYear.year,
      track: selectedTrack || undefined,
      label: needsTrack && selectedTrack
        ? `${activeYear.label} — ${selectedTrack}`
        : activeYear.label
    };
    onConfirm(level);
  };

  const chooseCycle = (idx: number) => {
    setSelectedCycleIdx(idx);
    setSelectedYearIdx(null);
    setSelectedTrack("");
    setStep(2);
  };

  const chooseYear = (yIdx: number) => {
    setSelectedYearIdx(yIdx);
    setSelectedTrack("");
    const yr = activeCycle?.years[yIdx];
    setStep(yr?.tracks && yr.tracks.length > 0 ? 3 : 2);
  };

  const cycleMeta: Record<string, { icon: React.ReactNode; titleKey: string; descKey: string }> = {
    primaire: { icon: <Backpack size={26} />, titleKey: "level_q_primaire_title", descKey: "level_q_primaire_desc" },
    moyen: { icon: <School size={26} />, titleKey: "level_q_moyen_title", descKey: "level_q_moyen_desc" },
    lycee: { icon: <GraduationCap size={26} />, titleKey: "level_q_lycee_title", descKey: "level_q_lycee_desc" },
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="text-center py-3">
        <div className="text-4xl mb-2">🎓</div>
        <h1 className="text-lg font-black text-text-primary">{t("level_picker_title")}</h1>
        <p className="text-xs text-text-secondary mt-1">{t("level_q_subtitle")}</p>
        <p className="text-[10px] text-primary font-bold mt-0.5">{t("level_picker_welcome", studentName)}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {[1, 2, 3].map(s => (
          <span key={s} className={`w-2 h-2 rounded-full transition-all ${step >= s ? "bg-primary w-5" : "bg-border-custom"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: which school phase? */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-3"
          >
            <span className="text-sm font-black text-text-primary text-center">{t("level_q_cycle_question")}</span>
            {questionnaireCycles.map((cycle, idx) => {
              const meta = cycleMeta[cycle.cycle];
              const selected = selectedCycleIdx === idx;
              return (
                <button
                  key={cycle.cycle}
                  onClick={() => chooseCycle(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    selected
                      ? "bg-primary text-white border-primary shadow-md scale-[1.01]"
                      : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20 active:scale-[0.99]"
                  }`}
                >
                  <span className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${
                    selected ? "bg-white/20" : "bg-primary/10 text-primary"
                  }`}>
                    {meta.icon}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-black">{t(meta.titleKey)}</span>
                    <span className={`text-[10px] font-semibold leading-snug ${selected ? "text-white/80" : "text-text-secondary"}`}>
                      {t(meta.descKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Step 2: which year? */}
        {step === 2 && activeCycle && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-3"
          >
            <span className="text-sm font-black text-text-primary text-center">
              {t(cycleMeta[activeCycle.cycle].titleKey)}
            </span>
            <span className="text-xs font-bold text-text-secondary text-center -mt-1.5">{t("level_q_year_question")}</span>
            <div className="grid grid-cols-2 gap-2">
              {activeCycle.years.map((yr, yIdx) => (
                <button
                  key={yr.year}
                  onClick={() => chooseYear(yIdx)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedYearIdx === yIdx
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20 active:scale-[0.99]"
                  }`}
                >
                  <span className="text-xs font-black">{yr.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: which track? (only for secondary years 2-3) */}
        {step === 3 && activeYear?.tracks && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-3"
          >
            <span className="text-sm font-black text-text-primary text-center">{t("level_q_track_question")}</span>
            <div className="flex flex-col gap-2">
              {activeYear.tracks.map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedTrack === track
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-surface border-border-custom text-text-primary hover:bg-border-custom/20 active:scale-[0.99]"
                  }`}
                >
                  <span className="text-xs font-black">{track}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back + Confirm */}
      <div className="flex flex-col gap-2 mt-auto pt-2">
        {step > 1 && (
          <button
            onClick={() => { setStep((step - 1) as 1 | 2 | 3); if (step === 3) setSelectedTrack(""); }}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-border-custom text-text-primary font-black text-xs hover:bg-border-custom/20 active:scale-[0.98] transition-all"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" /> {t("level_q_back")}
          </button>
        )}
        {canConfirm && (
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-primary text-white font-black text-sm rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            {t("level_picker_confirm")}
          </button>
        )}
      </div>
    </div>
  );
}

export default LevelPickerScreen;
