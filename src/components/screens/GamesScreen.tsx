"use client";
import { useState } from "react";
import { useBloom, AppLanguage } from "@/context/BloomContext";
import { MathQuizGame, MemoryMatchingGame, SpeedArithmeticGame, WordBuilderGame, VocabMatchGame, IslamicQuizGame, FlashcardsGame, TimelineGame, PhysicsLabGame, SpellingBeeGame, CrosswordGame, WilayaMatchGame } from "@/games";
import { Gamepad, X, Clock, Globe, Brain, Trophy, BookOpen, Star, Zap } from "lucide-react";

function GamesScreen({
  t,
  addPoints,
  userPoints
}: {
  t: (k: string, ...a: (string | number)[]) => string;
  addPoints: (pts: number) => void;
  userPoints: number;
}) {
  const { currentUser, userRole, studentLevels, appLanguage, customGames } = useBloom();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const studentName = (userRole === "youth" && currentUser?.name) ? currentUser.name : "Sara";
  const studentLevel = studentLevels[studentName];
  const cycle = studentLevel?.cycle || "moyen";

  // Find if active game is a custom game
  const activeCustomGame = customGames?.find(g => g.id === activeGame);

  if (activeGame === "math" || (activeCustomGame && activeCustomGame.type === "quiz")) {
    return (
      <MathQuizGame
        t={t}
        onExit={() => setActiveGame(null)}
        addPoints={addPoints}
        cycle={cycle}
        appLanguage={appLanguage}
        customQuestions={activeCustomGame?.questions}
        customTitle={activeCustomGame?.title}
      />
    );
  }

  if (activeGame === "memory" || (activeCustomGame && activeCustomGame.type === "memory")) {
    return (
      <MemoryMatchingGame
        t={t}
        onExit={() => setActiveGame(null)}
        addPoints={addPoints}
        cycle={cycle}
        customEmojis={activeCustomGame?.emojis}
        customTitle={activeCustomGame?.title}
      />
    );
  }

  if (activeGame === "speedArithmetic") {
    return <SpeedArithmeticGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "wordBuilder") {
    return <WordBuilderGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "vocabMatch") {
    return <VocabMatchGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "islamicQuiz") {
    return <IslamicQuizGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} appLanguage={appLanguage} />;
  }
  if (activeGame === "flashcards") {
    return <FlashcardsGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "timeline") {
    return <TimelineGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "physicsLab") {
    return <PhysicsLabGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "spellingBee") {
    return <SpellingBeeGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "crossword") {
    return <CrosswordGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }
  if (activeGame === "wilayaMatch") {
    return <WilayaMatchGame t={t} onExit={() => setActiveGame(null)} addPoints={addPoints} cycle={cycle} />;
  }

  // Custom games matching student's cycle
  const levelCustomGames = customGames?.filter(g => g.cycle === cycle) || [];

  const gameList = [
    { id: "memory", title: t("mem_title"), desc: cycle === "primaire" ? t("game_mem_desc_primary") : cycle === "moyen" ? t("game_mem_desc_moyen") : t("game_mem_desc_lycee"), icon: <Brain size={120} />, tag: t("game_brain_title"), tagBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" },
    { id: "math", title: t("game_math_challenge"), desc: cycle === "primaire" ? t("game_math_desc_primary") : cycle === "moyen" ? t("game_math_desc_moyen") : t("game_math_desc_lycee"), icon: <Trophy size={120} />, tag: t("game_challenges_title"), tagBg: "", tagStyle: { background: 'var(--accent-yellow)', opacity: 0.6, color: 'var(--text-primary)' } },
    { id: "speedArithmetic", title: t("game_speed_arithmetic"), desc: cycle === "primaire" ? t("game_speed_desc_primary") : cycle === "moyen" ? t("game_speed_desc_moyen") : t("game_speed_desc_lycee"), icon: <Zap size={120} />, tag: t("game_tag_mental_math"), tagBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    { id: "wordBuilder", title: t("game_word_builder"), desc: t("game_word_desc"), icon: <BookOpen size={120} />, tag: t("game_tag_vocabulary"), tagBg: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
    { id: "vocabMatch", title: t("game_vocab_match"), desc: t("game_vocab_desc"), icon: <Globe size={120} />, tag: t("game_tag_language"), tagBg: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
    { id: "islamicQuiz", title: t("game_islamic_quiz"), desc: t("game_islamic_desc"), icon: <Star size={120} />, tag: t("game_tag_islamic"), tagBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { id: "flashcards", title: t("game_flashcards"), desc: t("game_flash_desc"), icon: <Brain size={120} />, tag: t("game_tag_science"), tagBg: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
    { id: "timeline", title: t("game_timeline"), desc: t("game_timeline_desc"), icon: <Clock size={120} />, tag: t("game_tag_history"), tagBg: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
    { id: "physicsLab", title: t("game_physics_lab"), desc: t("game_physics_desc"), icon: <Zap size={120} />, tag: t("game_tag_physics"), tagBg: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
    { id: "spellingBee", title: t("game_spelling_bee"), desc: t("game_spelling_desc"), icon: <BookOpen size={120} />, tag: t("game_tag_english"), tagBg: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" },
    { id: "crossword", title: t("game_crossword"), desc: t("game_crossword_desc"), icon: <Gamepad size={120} />, tag: t("game_tag_puzzle"), tagBg: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
    { id: "wilayaMatch", title: t("game_wilaya_match"), desc: t("game_wilaya_desc"), icon: <Globe size={120} />, tag: t("game_tag_geography"), tagBg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300" },
  ];

  return (
    <>
      <div className="p-4 rounded-3xl bg-surface border border-border-custom shadow-xs flex flex-col gap-2">
        <h3 className="font-black text-sm text-text-primary">{t("games_choose_type")}</h3>
        <p className="text-[11px] text-text-secondary">{t("games_tailored_for", studentLevel?.label || t("game_your_level"))}</p>
      </div>

      {/* Games Selection List */}
      <div className="flex flex-col gap-3">
        {gameList.map((game) => (
          <div key={game.id} className="p-4 rounded-3xl bg-surface border border-border-custom shadow-sm relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 p-8 text-indigo-200 dark:text-indigo-950/20 translate-x-4 -translate-y-4 select-none pointer-events-none">
              {game.icon}
            </div>
            <div className="z-10 flex flex-col gap-1 max-w-[70%]">
              <span
                className={`text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full w-max ${game.id === "math" ? "" : game.tagBg}`}
                style={game.id === "math" ? { background: 'var(--accent-yellow)', opacity: 0.6, color: 'var(--text-primary)' } : {}}
              >
                {game.tag}
              </span>
              <h4 className="font-black text-base text-text-primary mt-1">{game.title}</h4>
              <p className="text-xs text-text-secondary leading-snug">{game.desc}</p>
            </div>
            <button
              onClick={() => setActiveGame(game.id)}
              className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-white py-3 rounded-2xl text-xs font-black shadow-xs transition-all mt-2 z-10"
            >
              {t("game_start_play")}
            </button>
          </div>
        ))}

        {/* Custom Games (admin-created) */}
        {levelCustomGames.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-px bg-border-custom/50" />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t("game_pedagogical_games")}</span>
              <div className="flex-1 h-px bg-border-custom/50" />
            </div>
            {levelCustomGames.map(game => (
              <div key={game.id} className="p-4 rounded-3xl bg-surface border-2 border-primary/20 shadow-sm relative overflow-hidden flex flex-col gap-4">
                <div className="absolute top-2 right-3 z-20">
                  <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border border-primary/20">
                    {t("game_admin_created")}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-8 text-primary/10 translate-x-4 -translate-y-4 select-none pointer-events-none">
                  {game.type === "memory" ? <Brain size={100} /> : <Trophy size={100} />}
                </div>
                <div className="z-10 flex flex-col gap-1 max-w-[75%]">
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full w-max">
                    {game.type === "memory" ? t("mem_title") : t("game_quiz_challenge")}
                  </span>
                  <h4 className="font-black text-base text-text-primary mt-1">{game.title}</h4>
                  <p className="text-xs text-text-secondary leading-snug">{game.description}</p>
                </div>
                <button
                  onClick={() => setActiveGame(game.id)}
                  className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-white py-3 rounded-2xl text-xs font-black shadow-xs transition-all mt-2 z-10"
                >
                  {t("game_start_play")}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

/* ==========================================================================
   SCREEN: Psychological Support Screen
   ========================================================================== */

export default GamesScreen;
