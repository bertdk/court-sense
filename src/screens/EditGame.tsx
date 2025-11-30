import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, Player } from '../types';
import { getGame, saveGame, saveTeam } from '../storage';
import './GameSetup.css';

export default function EditGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [yourTeamName, setYourTeamName] = useState('');
  const [opponentTeamName, setOpponentTeamName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    if (gameId) {
      const loadedGame = getGame(gameId);
      if (loadedGame) {
        // Migrate players without numbers
        let needsSave = false;
        const migratedPlayers = loadedGame.yourTeam.players.map((player, index) => {
          if (player.number === undefined) {
            needsSave = true;
            return { ...player, number: 4 + index };
          }
          return player;
        });
        
        if (needsSave) {
          const migratedGame = {
            ...loadedGame,
            yourTeam: {
              ...loadedGame.yourTeam,
              players: migratedPlayers,
            },
          };
          saveGame(migratedGame);
          setGame(migratedGame);
          setPlayers(migratedPlayers);
        } else {
          setGame(loadedGame);
          setPlayers(loadedGame.yourTeam.players);
        }
        
        setYourTeamName(loadedGame.yourTeam.name);
        setOpponentTeamName(loadedGame.opponentTeam.name);
      }
    }
  }, [gameId]);

  const getNextPlayerNumber = () => {
    if (players.length === 0) return 4;
    const maxNumber = Math.max(...players.map(p => p.number), 3);
    return maxNumber + 1;
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        number: getNextPlayerNumber(),
      };
      const updatedPlayers = [...players, newPlayer];
      setPlayers(updatedPlayers);
      setNewPlayerName('');
      // Save immediately after adding player
      if (gameId && game) {
        const updatedGame: Game = {
          ...game,
          yourTeam: {
            ...game.yourTeam,
            players: updatedPlayers,
          },
        };
        saveGame(updatedGame);
        setGame(updatedGame);
      }
    }
  };

  const updatePlayerNumber = (playerId: string, number: number) => {
    if (number < 0 || number > 99) return;
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, number } : p
    );
    setPlayers(updatedPlayers);
    // Save immediately
    if (gameId && game) {
      const updatedGame: Game = {
        ...game,
        yourTeam: {
          ...game.yourTeam,
          players: updatedPlayers,
        },
      };
      saveGame(updatedGame);
      setGame(updatedGame);
    }
  };

  const removePlayer = (playerId: string) => {
    const updatedPlayers = players.filter(p => p.id !== playerId);
    setPlayers(updatedPlayers);
    // Save immediately after removing player
    if (gameId && game) {
      const updatedGame: Game = {
        ...game,
        yourTeam: {
          ...game.yourTeam,
          players: updatedPlayers,
        },
      };
      saveGame(updatedGame);
      setGame(updatedGame);
    }
  };

  const saveSetup = () => {
    if (!gameId || !yourTeamName.trim()) {
      alert('Please enter your team name');
      return;
    }

    const updatedGame: Game = {
      ...game!,
      yourTeam: {
        id: game!.yourTeam.id,
        name: yourTeamName.trim(),
        players,
      },
      opponentTeam: {
        name: opponentTeamName.trim() || 'Opponent',
      },
    };

    saveGame(updatedGame);
    // Save team for reuse
    if (yourTeamName.trim()) {
      saveTeam({
        id: game!.yourTeam.id,
        name: yourTeamName.trim(),
        players,
      });
    }
    setGame(updatedGame);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-setup">
      <div className="setup-header">
        <button className="btn-back" onClick={() => navigate(`/game/${gameId}/play`)}>
          ← Back to Game
        </button>
        <h1>Edit Game</h1>
      </div>

      <div className="setup-content">
        <div className="setup-section">
          <label>
            <span>Your Team Name *</span>
            <input
              type="text"
              value={yourTeamName}
              onChange={(e) => setYourTeamName(e.target.value)}
              placeholder="Enter team name"
              onBlur={saveSetup}
            />
          </label>
        </div>

        <div className="setup-section">
          <label>
            <span>Opponent Team Name</span>
            <input
              type="text"
              value={opponentTeamName}
              onChange={(e) => setOpponentTeamName(e.target.value)}
              placeholder="Enter opponent name"
              onBlur={saveSetup}
            />
          </label>
        </div>

        <div className="setup-section">
          <label>
            <span>Game Date</span>
            <input
              type="date"
              value={game.date}
              onChange={(e) => {
                const updated = { ...game, date: e.target.value };
                setGame(updated);
                saveGame(updated);
              }}
            />
          </label>
        </div>

        <div className="setup-section">
          <h2>Your Team Players</h2>
          <div className="add-player">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter player name"
            />
            <button className="btn-add" onClick={addPlayer}>
              Add Player
            </button>
          </div>

          <div className="players-list">
            {players.length === 0 ? (
              <p className="empty-text">No players added yet</p>
            ) : (
              players.map((player) => (
                <div key={player.id} className="player-item">
                  <div className="player-info">
                    <input
                      type="number"
                      className="player-number-input"
                      value={player.number}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 0;
                        updatePlayerNumber(player.id, num);
                      }}
                      min="0"
                      max="99"
                    />
                    <span className="player-name">{player.name}</span>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => {
                      removePlayer(player.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="setup-actions">
        <button
          className="btn-secondary"
          onClick={() => {
            saveSetup();
            navigate(`/game/${gameId}/view`);
          }}
          disabled={!yourTeamName.trim()}
        >
          View Stats
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            saveSetup();
            navigate(`/game/${gameId}/play`);
          }}
          disabled={!yourTeamName.trim()}
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}

