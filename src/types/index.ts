export interface User {
  id: string;
  username: string;
  pin: string;
  createdAt: number;
  avatar?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'written' | 'multiple' | 'boolean' | 'fill';
  acceptedAnswers?: string[]; // Lista de respuestas aceptadas (sinónimos)
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grade: '5to' | '6to';
}

export interface GameRoom {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  gameMode: '1v1' | '1v3' | '2v2' | '3v3';
  hostId: string;
  players: GamePlayer[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  timerEnd: number;
  createdAt: number;
}

export interface GamePlayer {
  userId: string;
  username: string;
  team: 'red' | 'blue' | 'spectator';
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface UserProgress {
  userId: string;
  username: string;
  totalXP: number;
  currentLevel: number;
  streak: number;
  lastActiveDate: string;
  completedQuizzes: string[];
  totalCorrectAnswers: number;
  totalAnswers: number;
  leaderboardPosition?: number;
}

export interface AdminCredentials {
  pin: string; // PIN de administrador
}
