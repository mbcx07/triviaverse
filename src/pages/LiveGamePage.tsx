import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gameService, progressService } from '../services/firebase';
import type { Question } from '../types';
import './LiveGamePage.css';

export default function LiveGamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const currentUser = localStorage.getItem('currentUser');
  
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [room, setRoom] = useState<any>(null);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  const hasAnswered = useRef<boolean>(false);

  useEffect(() => {
    if (!currentUser || !code) {
      navigate('/competition');
      return;
    }

    const listener = gameService.listenToGameRoom(code, (gameRoom) => {
      setRoom(gameRoom);
      setLoading(false);

      if (gameRoom.currentQuestion) {
        setCurrentQuestion(gameRoom.currentQuestion);
        setTimer(30);
        setShowResult(false);
        setAnswer('');
        hasAnswered.current = false;
        setQuestionCount(gameRoom.currentQuestionIndex + 1);
      }

      if (gameRoom.status === 'finished') {
        navigate(`/results/${code}`);
      }
    });

    return () => {
      if (listener && typeof listener === 'function') {
        try {
          listener();
        } catch (e) {
          // Cleanup error
        }
      }
    };
  }, [code, currentUser, navigate]);

  useEffect(() => {
    if (timer > 0 && !showResult) {
      timerInterval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && !hasAnswered.current && !showResult) {
      handleSubmitAnswer();
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timer, showResult]);

  useEffect(() => {
    if (room && room.timerEnd && !showResult) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000));
        setTimer(remaining);

        if (remaining <= 0 && !hasAnswered.current) {
          handleSubmitAnswer();
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [room, showResult]);

  const handleSubmitAnswer = async () => {
    if (!currentUser || !code || hasAnswered.current || !currentQuestion) return;

    hasAnswered.current = true;
    setShowResult(true);

    try {
      const result: boolean = await gameService.submitAnswer(code, currentUser, answer);
      setIsCorrect(result);

      if (result) {
        const userData = await progressService.getUserProgress(currentUser);
        if (userData) {
          const newXP = (userData.totalXP || 0) + gameService.getDifficultyPoints(currentQuestion.difficulty);
          await progressService.updateUserProgress(currentUser, {
            totalXP: newXP,
            totalCorrectAnswers: (userData.totalCorrectAnswers || 0) + 1,
            totalAnswers: (userData.totalAnswers || 0) + 1,
            lastActiveDate: new Date().toISOString()
          });
          setUserScore(newXP);
        }
      }
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando juego...</div>;
  }

  if (!room) {
    return <div className="error">Juego no encontrado</div>;
  }

  if (!currentQuestion && !showResult) {
    return (
      <div className="waiting">
        <div className="waiting-card">
          <h1>⏰ Esperando siguiente pregunta...</h1>
          <p>El host iniciará la siguiente pregunta pronto</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-game">
      <div className="game-container">
        <div className="game-header">
          <div className="timer-display">
            <div className={`timer-circle ${timer <= 10 ? 'warning' : timer <= 5 ? 'danger' : ''}`}>
              <span className="timer-number">{timer}</span>
            </div>
          </div>

          <div className="question-counter">
            Pregunta {questionCount}
          </div>

          <div className="score-display">
            <span className="score-icon">⚡</span>
            <span className="score-value">{userScore} XP</span>
          </div>
        </div>

        {currentQuestion && !showResult && (
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">Pregunta {questionCount}</span>
              <span className={`difficulty-badge ${currentQuestion.difficulty}`}>
                {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                 currentQuestion.difficulty === 'medium' ? 'Medio' : 'Difícil'}
              </span>
            </div>

            <h2 className="question-text">{currentQuestion.text}</h2>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className="answer-input"
              rows={3}
              disabled={showResult}
            />

            <button
              onClick={handleSubmitAnswer}
              disabled={!answer || showResult}
              className="submit-button"
            >
              Enviar Respuesta
            </button>
          </div>
        )}

        {showResult && currentQuestion && (
          <div className="result-card">
            <div className={`result-header ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
            </div>

            {currentQuestion.explanation && (
              <div className="explanation-text">
                <strong>Explicación:</strong> {currentQuestion.explanation}
              </div>
            )}

            {isCorrect && (
              <div className="points-earned">
                +{gameService.getDifficultyPoints(currentQuestion.difficulty)} XP
              </div>
            )}

            <div className="waiting-next">
              Esperando siguiente pregunta...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
