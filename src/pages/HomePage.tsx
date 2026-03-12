import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService, authService } from '../services/firebase';
import type { UserProgress } from '../types';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem('currentUser');

  useEffect(() => {
    const loadProgress = async () => {
      if (currentUser) {
        try {
          const userData = await progressService.getUserProgress(currentUser);
          setProgress(userData as UserProgress);

          const leaderboardData = await progressService.getLeaderboard(10);
          setLeaderboard(leaderboardData);
        } catch (error) {
          console.error('Error al cargar progreso:', error);
        }
      }
      setLoading(false);
    };

    loadProgress();
  }, [currentUser]);

  const handleLogout = async () => {
    if (currentUser) {
      await authService.logout(currentUser);
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const totalXP = progress?.totalXP || 0;
  const currentLevel = calculateLevel(totalXP);
  const streak = progress?.streak || 0;

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Header con progreso */}
        <div className="progress-header">
          <div className="user-info">
            <div className="avatar">🎓</div>
            <div>
              <h2 className="user-name">{currentUser}</h2>
              <p className="user-level">Nivel {currentLevel}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>

          <div className="stats">
            <div className="stat">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{totalXP} XP</span>
            </div>
            <div className="stat">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{streak}</span>
            </div>
          </div>
        </div>

        {/* Modos de juego */}
        <div className="game-modes">
          <h2 className="section-title">Modos de Juego</h2>
          
          <div className="mode-card" onClick={() => navigate('/practice')}>
            <div className="mode-icon">📚</div>
            <div className="mode-info">
              <h3 className="mode-title">Modo Estudio</h3>
              <p className="mode-description">Practica con preguntas y aprende</p>
            </div>
            <div className="mode-arrow">→</div>
          </div>

          <div className="mode-card" onClick={() => navigate('/competition')}>
            <div className="mode-icon">🏆</div>
            <div className="mode-info">
              <h3 className="mode-title">Competencia en Vivo</h3>
              <p className="mode-description">Juega contra tus amigos</p>
            </div>
            <div className="mode-arrow">→</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <h2 className="section-title">🏆 Ranking</h2>
          
          <div className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <div 
                key={player.username} 
                className={`leaderboard-item ${player.username === currentUser ? 'current-user' : ''}`}
              >
                <div className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.username}</span>
                </div>
                <div className="player-stats">
                  <span className="player-level">Nivel {calculateLevel(player.totalXP)}</span>
                  <span className="player-xp">{player.totalXP} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
