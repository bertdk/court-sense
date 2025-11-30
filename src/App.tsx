import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import GameSetup from './screens/GameSetup';
import GameMode from './screens/GameMode';
import ViewMode from './screens/ViewMode';
import EditGame from './screens/EditGame';
import { loadGames } from './storage';
import { Game } from './types';

function App() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    setGames(loadGames());
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen games={games} setGames={setGames} />} />
        <Route path="/game/:gameId/setup" element={<GameSetup />} />
        <Route path="/game/:gameId/play" element={<GameMode />} />
        <Route path="/game/:gameId/view" element={<ViewMode />} />
        <Route path="/game/:gameId/edit" element={<EditGame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

