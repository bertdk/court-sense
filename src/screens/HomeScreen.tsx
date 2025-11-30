import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types';
import { saveGames, loadGames, deleteGame, getAllTeamNames, getTeamByName, saveTeam } from '../storage';
import { DeleteIcon } from '../components/Icons';
import './HomeScreen.css';

interface HomeScreenProps {
  games: Game[];
  setGames: (games: Game[]) => void;
}

export default function HomeScreen({ games, setGames }: HomeScreenProps) {
  const navigate = useNavigate();
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');

  // Reload games from storage when component mounts or when navigating back
  useEffect(() => {
    const loadedGames = loadGames();
    setGames(loadedGames);
  }, [setGames]);

  const handleDeleteGame = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      deleteGame(gameId);
      const updatedGames = games.filter(g => g.id !== gameId);
      setGames(updatedGames);
    }
  };

  const createNewGame = () => {
    const existingTeams = getAllTeamNames();
    // If no teams exist, go directly to create new team
    if (existingTeams.length === 0) {
      handleTeamSelection(false);
    } else {
      setShowTeamSelection(true);
    }
  };

  const handleTeamSelection = (useExisting: boolean) => {
    if (useExisting && selectedTeamName) {
      const existingTeam = getTeamByName(selectedTeamName);
      if (existingTeam) {
        const newGame: Game = {
          id: Date.now().toString(),
          yourTeam: {
            ...existingTeam,
            id: Date.now().toString() + '-team', // New team instance ID
          },
          opponentTeam: {
            name: '',
          },
          date: new Date().toISOString().split('T')[0],
          offenses: [],
        };
        const updatedGames = [...games, newGame];
        setGames(updatedGames);
        saveGames(updatedGames);
        navigate(`/game/${newGame.id}/setup`);
        return;
      }
    }
    // Create new game with empty team
    const newGame: Game = {
      id: Date.now().toString(),
      yourTeam: {
        id: Date.now().toString() + '-team',
        name: '',
        players: [],
      },
      opponentTeam: {
        name: '',
      },
      date: new Date().toISOString().split('T')[0],
      offenses: [],
    };
    const updatedGames = [...games, newGame];
    setGames(updatedGames);
    saveGames(updatedGames);
    navigate(`/game/${newGame.id}/setup`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>Court Sense</h1>
        <p className="subtitle">Basketball Statistics Tracker</p>
      </div>

      <div className="games-list">
        <h2>Your Games</h2>
        {games.length === 0 ? (
          <div className="empty-state">
            <p>No games yet. Create your first game to start tracking!</p>
          </div>
        ) : (
          <div className="games-grid">
            {games.map((game) => (
              <div
                key={game.id}
                className="game-card"
                onClick={() => navigate(`/game/${game.id}/setup`)}
              >
                <div className="game-card-header">
                  <h3>{game.yourTeam.name || 'Unnamed Team'}</h3>
                  <span className="game-date">{formatDate(game.date)}</span>
                </div>
                <div className="game-card-info">
                  <p>
                    <strong>vs</strong> {game.opponentTeam.name || 'Opponent'}
                  </p>
                  <p className="offenses-count">
                    {game.offenses.length} offense{game.offenses.length !== 1 ? 's' : ''} tracked
                  </p>
                </div>
                <div className="game-card-actions">
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/game/${game.id}/view`);
                    }}
                  >
                    View Stats
                  </button>
                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/game/${game.id}/play`);
                    }}
                  >
                    Play
                  </button>
                  <button
                    className="btn-secondary btn-icon"
                    onClick={(e) => handleDeleteGame(game.id, e)}
                    title="Delete game"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn-create-game" onClick={createNewGame}>
        + Create New Game
      </button>

      {showTeamSelection && (
        <div className="modal-overlay" onClick={() => setShowTeamSelection(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Select Team</h2>
            <div className="team-selection">
              <button
                className="btn-team-option"
                onClick={() => {
                  setShowTeamSelection(false);
                  handleTeamSelection(false);
                }}
              >
                Create New Team
              </button>
              {getAllTeamNames().length > 0 && (
                <>
                  <div className="team-divider">or</div>
                  <label>
                    <span>Select Existing Team</span>
                    <select
                      value={selectedTeamName}
                      onChange={(e) => setSelectedTeamName(e.target.value)}
                    >
                      <option value="">Choose a team...</option>
                      {getAllTeamNames().map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="btn-team-option"
                    onClick={() => {
                      if (selectedTeamName) {
                        setShowTeamSelection(false);
                        handleTeamSelection(true);
                      }
                    }}
                    disabled={!selectedTeamName}
                  >
                    Use Selected Team
                  </button>
                </>
              )}
            </div>
            <button className="btn-cancel" onClick={() => setShowTeamSelection(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

