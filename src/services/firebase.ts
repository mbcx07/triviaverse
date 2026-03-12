import { initializeApp } from 'firebase/app';
import { 
  getAuth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  onValue,
  push
} from 'firebase/database';

// Configuración de Firebase (se debe reemplazar con las credenciales reales)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "TU_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tu-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tu-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tu-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// ===============================
// AUTENTICACIÓN USUARIO + PIN
// ===============================

export const authService = {
  // Crear usuario con username + PIN
  async register(username: string, pin: string) {
    // Validar PIN (4 dígitos)
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('El PIN debe ser de 4 dígitos');
    }

    // Validar username
    if (username.length < 3) {
      throw new Error('El usuario debe tener al menos 3 caracteres');
    }

    // Verificar si el usuario ya existe
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      throw new Error('El usuario ya existe');
    }

    // Crear usuario en Firestore
    const userId = username; // Usar username como ID
    const userData = {
      username,
      pin,
      createdAt: Date.now(),
      totalXP: 0,
      currentLevel: 1,
      streak: 0,
      lastActiveDate: new Date().toISOString(),
      completedQuizzes: [],
      totalCorrectAnswers: 0,
      totalAnswers: 0
    };

    await setDoc(userRef, userData);

    // Crear sesión personalizada en Realtime DB
    const sessionRef = ref(rtdb, `sessions/${userId}`);
    await set(sessionRef, {
      username,
      active: true,
      lastSeen: Date.now()
    });

    return userData;
  },

  // Login con username + PIN
  async login(username: string, pin: string) {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userSnap.data() as any;

    if (userData.pin !== pin) {
      throw new Error('PIN incorrecto');
    }

    // Actualizar última actividad
    await updateDoc(userRef, {
      lastActiveDate: new Date().toISOString()
    });

    // Crear sesión en Realtime DB
    const sessionRef = ref(rtdb, `sessions/${username}`);
    await set(sessionRef, {
      username,
      active: true,
      lastSeen: Date.now()
    });

    return userData;
  },

  // Logout
  async logout(username: string) {
    // Eliminar sesión de Realtime DB
    const sessionRef = ref(rtdb, `sessions/${username}`);
    await set(sessionRef, {
      username,
      active: false,
      lastSeen: Date.now()
    });

    return null;
  }
};

// ===============================
// PROGRESO DE USUARIO (FIRESTORE)
// ===============================

export const progressService = {
  async getUserProgress(username: string) {
    const docRef = doc(db, 'users', username);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as any;
    }
    return null;
  },

  async updateUserProgress(username: string, updates: any) {
    const docRef = doc(db, 'users', username);
    await updateDoc(docRef, updates);
  },

  async getLeaderboard(limitCount: number = 10) {
    const q = query(
      collection(db, 'users'),
      orderBy('totalXP', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({
      username: doc.id,
      ...doc.data()
    }));
  }
};

// ===============================
// COMPETENCIA EN VIVO (REALTIME DB)
// ===============================

export const gameService = {
  // Crear sala de juego
  async createGameRoom(
    hostUsername: string,
    gameMode: '1v1' | '1v3' | '2v2' | '3v3',
    questions: any[]
  ) {
    const gameCode = this.generateGameCode();

    const gameRoom = {
      id: `game-${Date.now()}`,
      code: gameCode,
      status: 'waiting',
      gameMode,
      hostId: hostUsername,
      players: [],
      questions,
      currentQuestionIndex: 0,
      currentQuestion: null,
      timerEnd: null,
      createdAt: Date.now()
    };

    const roomRef = ref(rtdb, `games/${gameCode}`);
    await set(roomRef, gameRoom);

    return gameRoom;
  },

  // Unirse a una sala
  async joinGameRoom(gameCode: string, username: string) {
    const roomRef = ref(rtdb, `games/${gameCode}`);
    // username se usará más tarde para agregar el jugador a la sala
    console.log(`Uniendo ${username} a la sala ${gameCode}`);

    return new Promise((resolve, reject) => {
      onValue(roomRef, (snapshot) => {
        const room = snapshot.val();

        if (!room) {
          reject(new Error('Sala no encontrada'));
          return;
        }

        if (room.status !== 'waiting') {
          reject(new Error('La partida ya empezó'));
          return;
        }

        if (room.players.length >= this.getMaxPlayers(room.gameMode)) {
          reject(new Error('Sala llena'));
          return;
        }

        resolve(room);
      }, { onlyOnce: true });
    });
  },

  // Unirse a equipo
  async joinTeam(gameCode: string, username: string, team: 'red' | 'blue') {
    const playersRef = ref(rtdb, `games/${gameCode}/players`);

    const player = {
      userId: username,
      username,
      team,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0
    };

    return new Promise((resolve) => {
      const newPlayerRef = push(playersRef, player);
      newPlayerRef.then(() => {
        resolve(player);
      });
    });
  },

  // Empezar juego
  async startGame(gameCode: string) {
    const roomRef = ref(rtdb, `games/${gameCode}`);
    await set(roomRef, {
      status: 'playing',
      timerEnd: Date.now() + 30000 // 30 segundos por pregunta
    });
  },

  // Escuchar cambios en la sala
  listenToGameRoom(gameCode: string, callback: (room: any) => void) {
    const roomRef = ref(rtdb, `games/${gameCode}`);
    return onValue(roomRef, callback);
  },

  // Enviar respuesta
  async submitAnswer(gameCode: string, username: string, answer: string): Promise<boolean> {
    const roomRef = ref(rtdb, `games/${gameCode}`);

    return new Promise<boolean>((resolve) => {
      onValue(roomRef, (snapshot) => {
        const room = snapshot.val();
        if (!room) return;

        // Validar respuesta con tolerancia
        const currentQuestion = room.currentQuestion;
        if (!currentQuestion) return;

        const isCorrect = this.checkAnswer(answer, currentQuestion);

        // Actualizar progreso del jugador
        const players = room.players || [];
        const playerIndex = players.findIndex((p: any) => p.username === username);

        if (playerIndex >= 0) {
          players[playerIndex].totalAnswers++;

          if (isCorrect) {
            players[playerIndex].correctAnswers++;
            players[playerIndex].score += this.getDifficultyPoints(currentQuestion.difficulty);
          }

          set(roomRef, { players }).then(() => {
            resolve(isCorrect);
          });
        }
      }, { onlyOnce: true });
    });
  },

  // Comprobar respuesta con tolerancia
  checkAnswer(userAnswer: string, question: any): boolean {
    const normalizedUserAnswer = userAnswer.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const correctAnswer = question.correctAnswer.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Respuesta exacta
    if (normalizedUserAnswer === correctAnswer) {
      return true;
    }

    // Sinónimos
    if (question.acceptedAnswers) {
      for (const synonym of question.acceptedAnswers) {
        const normalizedSynonym = synonym.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedUserAnswer === normalizedSynonym) {
          return true;
        }
      }
    }

    return false;
  },

  // Obtener puntos por dificultad
  getDifficultyPoints(difficulty: string): number {
    switch (difficulty) {
      case 'hard': return 15;
      case 'medium': return 10;
      case 'easy': return 5;
      default: return 5;
    }
  },

  // Obtener máximo de jugadores por modo
  getMaxPlayers(gameMode: string): number {
    switch (gameMode) {
      case '1v1': return 2;
      case '1v3': return 4;
      case '2v2': return 4;
      case '3v3': return 6;
      default: return 2;
    }
  },

  // Generar código de sala (ej. A7K2)
  generateGameCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const code = [];
    for (let i = 0; i < 4; i++) {
      code.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    return code.join('');
  },

  // Calcular puntaje final
  calculateFinalScore(players: any[]): { redScore: number, blueScore: number } {
    const redScore = players
      .filter((p: any) => p.team === 'red')
      .reduce((sum: number, p: any) => sum + p.score, 0);

    const blueScore = players
      .filter((p: any) => p.team === 'blue')
      .reduce((sum: number, p: any) => sum + p.score, 0);

    return { redScore, blueScore };
  }
};

// ===============================
// ADMIN PANEL
// ===============================

export const adminService = {
  // Verificar PIN de administrador
  async verifyAdminPin(pin: string): Promise<boolean> {
    // PIN de admin hardcoded (se puede cambiar)
    const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '0000';
    return pin === ADMIN_PIN;
  },

  // Cargar pregunta
  async addQuestion(question: any) {
    const questionsRef = ref(rtdb, 'questions');
    const newQuestionRef = push(questionsRef);
    await set(newQuestionRef, question);
    return newQuestionRef.key;
  },

  // Obtener todas las preguntas
  async getAllQuestions() {
    const questionsRef = ref(rtdb, 'questions');

    return new Promise((resolve) => {
      onValue(questionsRef, (snapshot) => {
        const data = snapshot.val();
        const questions = data ? Object.keys(data).map((key: string) => ({
          id: key,
          ...data[key]
        })) : [];
        resolve(questions);
      }, { onlyOnce: true });
    });
  },

  // Eliminar pregunta
  async deleteQuestion(questionId: string) {
    const questionRef = ref(rtdb, `questions/${questionId}`);
    await set(questionRef, null);
  }
};
