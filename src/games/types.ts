export type AlgerianCycle = "primaire" | "moyen" | "lycee";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface SpeedArithmeticProblem {
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
}

export interface WordBuilderWord {
  scrambled: string;
  answer: string;
  hint: string;
}

export interface VocabPair {
  word: string;
  translation: string;
  language: string;
}

export interface TimelineEvent {
  year: number;
  label: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface WilayaInfo {
  number: number;
  name: string;
}

export interface PhysicsFormula {
  formula: string;
  description: string;
}

export interface SpellingBeeWord {
  word: string;
  definition: string;
  language: string;
}

export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
  clue?: string;
  clueNumber?: number;
  isBlocked?: boolean;
}

export interface GameConfig {
  emojis?: string[];
  gridCols?: string;
  timeLeft?: number;
  pointsPerWin?: number;
  title?: string;
}
