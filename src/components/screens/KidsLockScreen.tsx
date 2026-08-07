"use client";
import { Lock, Clock } from "lucide-react";

function KidsLockScreen({
  t,
  onBack
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  onBack: () => void;
}) {
  return (
    <div className="p-6 rounded-3xl bg-surface border border-border-custom shadow-md flex flex-col items-center gap-4 text-center py-12">
      <div className="bg-amber-500/10 text-amber-500 p-4 rounded-3xl">
        <Clock size={40} />
      </div>
      <div>
        <h2 className="font-black text-base text-text-primary">{t("kid_mode_locked_title")}</h2>
        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{t("kid_mode_locked_desc")}</p>
      </div>
      <button
        onClick={onBack}
        className="w-full bg-primary text-white py-3.5 rounded-2xl text-xs font-black shadow-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
      >
        <Lock size={14} /> {t("kid_mode_back_parent")}
      </button>
    </div>
  );
}


export default KidsLockScreen;
