"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { AppLanguage } from "@/context/BloomContext";
import { UserRound, Check, Lock, Globe, AlertCircle, Brain } from "lucide-react";

function RegisterScreen({
  t,
  register,
  appLanguage,
  setAppLanguage,
  isRtl,
  onNavigateToLogin
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  register: (e: string, n: string, p: string, r: any) => Promise<{ success: boolean; error?: string }>;
  appLanguage: string;
  setAppLanguage: (lang: any) => void;
  isRtl: boolean;
  onNavigateToLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"youth" | "parent" | "psychologist" | "admin">("youth");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const reg = await register(email, name, password, role);
    if (!reg.success) {
      setError(reg.error || "register_error_exists");
      return;
    }
    setSuccess(true);
    // Wait a moment and navigate to login
    setTimeout(() => {
      onNavigateToLogin();
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 relative z-20 overflow-y-auto scrollbar-none">
      {/* Language Bar */}
      <div className="flex justify-end items-center gap-1.5 mb-2">
        <Globe size={14} className="text-text-secondary animate-pulse" />
        <select
          value={appLanguage}
          onChange={(e) => setAppLanguage(e.target.value as any)}
          className="text-xs font-bold bg-surface border border-border-custom text-text-primary rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="en">{t("lang_english")}</option>
          <option value="ar">{t("lang_arabic")}</option>
          <option value="fr">{t("lang_french")}</option>
          <option value="kab">{t("lang_tamazight")}</option>
        </select>
      </div>

      {/* Main Register Card */}
      <div className="my-auto flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20 animate-pulse">
            <Brain size={36} className="text-primary fill-primary/10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              {t("register_title")}
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              {t("home_subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2.5 text-xs font-bold"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{t(error)}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2.5 text-xs font-bold"
            >
              <Check size={16} className="shrink-0" />
              <span>{t("register_success")}</span>
            </motion.div>
          )}

          {/* Full Name Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("register_name")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t("register_name")}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_email")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("login_email")}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("login_password")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary placeholder:text-text-secondary/60 outline-none transition-all`}
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary px-1">
              {t("register_role")}
            </label>
            <div className="relative">
              <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-text-secondary`}>
                <UserRound size={16} />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className={`w-full py-3 ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl bg-surface border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold text-text-primary outline-none transition-all appearance-none`}
              >
                <option value="youth">{t("role_youth")}</option>
                <option value="parent">{t("role_parent")}</option>
                <option value="psychologist">{t("role_psychologist")}</option>
              </select>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/30 transition-all"
          >
            {t("register_btn")}
          </button>
        </form>

        <button
          onClick={onNavigateToLogin}
          className="text-xs text-primary font-black hover:underline text-center mt-2 focus:outline-none"
        >
          {t("register_have_account")}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCREEN: Home Screen
   ========================================================================== */

export default RegisterScreen;
