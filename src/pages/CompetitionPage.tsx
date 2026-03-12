import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameService } from '../services/firebase';
import './CompetitionPage.css';

export default function CompetitionPage() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('currentUser');
  
  const [gameMode, setGameMode] = useState<'1v1' | '1v3' | '2v2' | '3v3'>('1v1');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión primero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Importar preguntas
      const { questions } = await import('../data/questions');
      const room = await gameService.createGameRoom(currentUser, gameMode, questions);
      navigate(`/waiting/${room.code}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión primero');
      return;
    }

    if (!roomCode) {
      setError('Ingresa el código de la sala');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await gameService.joinGameRoom(roomCode, currentUser);
      navigate(`/waiting/${roomCode}`);
    } catch (err: any) {
      setError(err.message || 'Error al unirse a la sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="competition-page">
      <div className="competition-container">
        <button onClick={() => navigate('/home')} className="back-button">
          ← Volver
        </button>

        <h1 className="page-title">🏆 Competencia en Vivo</h1>
        <p className="page-subtitle">Crea una sala o únete a una existente</p>

        {/* Crear sala */}
        <div className="section">
          <h2 className="section-title">Crear Sala</h2>
          
          <div className="game-modes">
            <button
              className={`mode-button ${gameMode === '1v1' ? 'active' : ''}`}
              onClick={() => setGameMode('1v1')}
            >
              <span className="mode-emoji">⚔️</span>
              <span className="mode-name">1 vs 1</span>
            </button>
            
            <button
              className={`mode-button ${gameMode === '1v3' ? 'active' : ''}`}
              onClick={() => setGameMode('1v3')}
            >
              <span className="mode-emoji">👥</span>
              <span className="mode-name">1 vs 3</span>
            </button>
            
            <button
              className={`mode-button ${gameMode === '2v2' ? 'active' : ''}`}
              onClick={() => setGameMode('2v2')}
            >
              <span className="mode-emoji">👥</span>
              <span className="mode-name">2 vs 2</span>
            </button>
            
            <button
              className={`mode-button ${gameMode === '3v3' ? 'active' : ''}`}
              onClick={() => setGameMode('3v3')}
            >
              <span className="mode-emoji">👥</span>
              <span className="mode-name">3 vs 3</span>
            </button>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="create-button"
          >
            {loading ? 'Creando...' : '✨ Crear Sala'}
          </button>
        </div>

        {/* Unirse a sala */}
        <div className="section">
          <h2 className="section-title">Unirse a Sala</h2>
          
          <div className="join-form">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Código de sala (ej. A7K2)"
              maxLength={4}
              className="code-input"
            />
            
            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="join-button"
            >
              {loading ? 'Uniendo...' : '🚀 Unirse'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
