import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gameService } from '../services/firebase';
import './LiveResultsPage.css';

export default function LiveResultsPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate('/competition');
      return;
    }

    // Escuchar cambios en la sala
    const unsubscribe = gameService.listenToGameRoom(code, (gameRoom) => {
      setRoom(gameRoom);
      setLoading(false);

      if (gameRoom.status === 'finished') {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [code, navigate]);

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleCreateNewGame = () => {
    navigate('/competition');
  };

  if (loading) {
    return <div className="loading">Cargando resultados...</div>;
  }

  if (!room) {
    return <div className="error">Resultados no encontrados</div>;
  }

  const { redScore, blueScore } = gameService.calculateFinalScore(room.players);
  const winner = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'tie';
  const currentUser = localStorage.getItem('currentUser');

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Ganador */}
        <div className={`winner-banner ${winner}`}>
          <div className="winner-icon">
            {winner === 'red' && '🔴'}
            {winner === 'blue' && '🔵'}
            {winner === 'tie' && '🤝'}
          </div>
          <h1 className="winner-text">
            {winner === 'red' && '¡Equipo Rojo Gana!'}
            {winner === 'blue' && '¡Equipo Azul Gana!'}
            {winner === 'tie' && '¡Empate!'}
          </h1>
        </div>

        {/* Puntajes */}
        <div className="scores-display">
          <div className={`team-score red ${winner === 'red' ? 'winner' : ''}`}>
            <div className="team-header">🔴 Equipo Rojo</div>
            <div className="score-big">{redScore}</div>
            <div className="score-label">puntos</div>
          </div>

          <div className="vs-divider">VS</div>

          <div className={`team-score blue ${winner === 'blue' ? 'winner' : ''}`}>
            <div className="team-header">🔵 Equipo Azul</div>
            <div className="score-big">{blueScore}</div>
            <div className="score-label">puntos</div>
          </div>
        </div>

        {/* Ranking individual */}
        <div className="ranking-section">
          <h2 className="section-title">🏆 Ranking Individual</h2>
          
          <div className="ranking-list">
            {room.players
              .sort((a: any, b: any) => b.score - a.score)
              .map((player: any, index: number) => (
                <div 
                  key={player.username} 
                  className={`ranking-item ${player.username === currentUser ? 'current-user' : ''} ${player.team === winner ? 'winner-team' : ''}`}
                >
                  <div className="rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    <span className={`player-team ${player.team}`}>
                      {player.team === 'red' && '🔴'}
                      {player.team === 'blue' && '🔵'}
                    </span>
                  </div>
                  <div className="player-stats">
                    <span className="score-value">{player.score} pts</span>
                    <span className="accuracy">
                      {player.totalAnswers > 0 
                        ? `${Math.round((player.correctAnswers / player.totalAnswers) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Botones */}
        <div className="action-buttons">
          <button onClick={handleGoHome} className="action-button home">
            🏠 Ir al Inicio
          </button>
          <button onClick={handleCreateNewGame} className="action-button new-game">
            🎮 Nueva Partida
          </button>
        </div>
      </div>
    </div>
  );
}
