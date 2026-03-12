import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gameService } from '../services/firebase';
import './WaitingRoomPage.css';

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const currentUser = localStorage.getItem('currentUser');
  
  const [room, setRoom] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser || !code) {
      navigate('/competition');
      return;
    }

    // Escuchar cambios en la sala
    gameService.listenToGameRoom(code, (gameRoom) => {
      setRoom(gameRoom);
      setLoading(false);

      // Si el juego empieza, ir a la página de juego
      if (gameRoom.status === 'playing') {
        navigate(`/live/${code}`);
      }
    });
  }, [code, currentUser, navigate]);

  const handleJoinTeam = async (team: 'red' | 'blue') => {
    if (!currentUser || !code) return;

    try {
      setSelectedTeam(team);
      await gameService.joinTeam(code, currentUser, team);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartGame = async () => {
    if (!code || !currentUser) return;

    try {
      await gameService.startGame(code);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Cargando sala...</div>;
  }

  if (!room) {
    return <div className="error">Sala no encontrada</div>;
  }

  const isHost = room.hostId === currentUser;
  const maxPlayers = gameService.getMaxPlayers(room.gameMode);
  const currentPlayers = room.players.length;
  const canStart = isHost && currentPlayers >= 2; // Mínimo 2 jugadores

  return (
    <div className="waiting-room">
      <div className="waiting-container">
        <div className="room-header">
          <h1 className="room-title">🏆 Sala de Espera</h1>
          <div className="room-code">{code}</div>
          <p className="game-mode">
            Modo: {room.gameMode === '1v1' ? '1 vs 1' : 
                  room.gameMode === '1v3' ? '1 vs 3' :
                  room.gameMode === '2v2' ? '2 vs 2' : '3 vs 3'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Selección de equipo */}
        {currentUser && !room.players.find((p: any) => p.username === currentUser) && (
          <div className="team-selection">
            <h2 className="section-title">Selecciona tu equipo</h2>
            <div className="teams">
              <button
                onClick={() => handleJoinTeam('red')}
                className={`team-btn red ${selectedTeam === 'red' ? 'active' : ''}`}
                disabled={selectedTeam !== null}
              >
                <span className="team-emoji">🔴</span>
                <span className="team-name">Equipo Rojo</span>
              </button>
              
              <button
                onClick={() => handleJoinTeam('blue')}
                className={`team-btn blue ${selectedTeam === 'blue' ? 'active' : ''}`}
                disabled={selectedTeam !== null}
              >
                <span className="team-emoji">🔵</span>
                <span className="team-name">Equipo Azul</span>
              </button>
            </div>
          </div>
        )}

        {/* Jugadores en sala */}
        <div className="players-section">
          <h2 className="section-title">
            Jugadores ({currentPlayers}/{maxPlayers})
          </h2>
          
          <div className="teams-display">
            <div className="team-display red">
              <h3 className="team-title">🔴 Equipo Rojo</h3>
              <div className="players-list">
                {room.players
                  .filter((p: any) => p.team === 'red')
                  .map((player: any) => (
                    <div key={player.username} className="player-item">
                      <span className="player-name">{player.username}</span>
                      {player.username === currentUser && <span className="you-badge">Tú</span>}
                    </div>
                  ))}
              </div>
            </div>

            <div className="team-display blue">
              <h3 className="team-title">🔵 Equipo Azul</h3>
              <div className="players-list">
                {room.players
                  .filter((p: any) => p.team === 'blue')
                  .map((player: any) => (
                    <div key={player.username} className="player-item">
                      <span className="player-name">{player.username}</span>
                      {player.username === currentUser && <span className="you-badge">Tú</span>}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de empezar (solo host) */}
        {isHost && canStart && (
          <button
            onClick={handleStartGame}
            className="start-button"
          >
            🚀 Empezar Juego
          </button>
        )}

        {isHost && !canStart && (
          <div className="waiting-message">
            Esperando más jugadores... (mínimo 2 para empezar)
          </div>
        )}

        {!isHost && (
          <div className="waiting-message">
            Esperando que el host inicie el juego...
          </div>
        )}
      </div>
    </div>
  );
}
