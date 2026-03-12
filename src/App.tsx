import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CompetitionPage from './pages/CompetitionPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import LiveGamePage from './pages/LiveGamePage';
import LiveResultsPage from './pages/LiveResultsPage';
import './App.css';

function App() {
  const currentUser = localStorage.getItem('currentUser');

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Página pública - Login */}
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/home" /> : <LoginPage />} 
          />

          {/* Rutas protegidas - Requieren autenticación */}
          <Route
            path="/home"
            element={currentUser ? <HomePage /> : <Navigate to="/login" />}
          />

          <Route
            path="/competition"
            element={currentUser ? <CompetitionPage /> : <Navigate to="/login" />}
          />

          <Route
            path="/waiting/:code"
            element={currentUser ? <WaitingRoomPage /> : <Navigate to="/login" />}
          />

          <Route
            path="/live/:code"
            element={currentUser ? <LiveGamePage /> : <Navigate to="/login" />}
          />

          <Route
            path="/results/:code"
            element={currentUser ? <LiveResultsPage /> : <Navigate to="/login" />}
          />

          {/* Ruta por defecto */}
          <Route
            path="/"
            element={<Navigate to={currentUser ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
