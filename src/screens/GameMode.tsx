import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, Offense, OffenseResult } from '../types';
import { getGame, saveGame } from '../storage';
import { EditIcon } from '../components/Icons';
import './GameMode.css';

export default function GameMode() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // Time in milliseconds
  const [passes, setPasses] = useState(0);
  const [playersOnCourt, setPlayersOnCourt] = useState<string[]>([]);
  const [showShotOptions, setShowShotOptions] = useState(false);
  const [showTurnoverOptions, setShowTurnoverOptions] = useState(false);
  const [showTimeAdjust, setShowTimeAdjust] = useState(false);
  const [timeAdjustValue, setTimeAdjustValue] = useState('');
  const [shotModalKey, setShotModalKey] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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
        } else {
          setGame(loadedGame);
        }
        
        // Initialize with first 5 players on court by default
        const gameToUse = needsSave ? { ...loadedGame, yourTeam: { ...loadedGame.yourTeam, players: migratedPlayers } } : loadedGame;
        if (gameToUse.yourTeam.players.length > 0) {
          setPlayersOnCourt(prev => {
            // Only set if not already initialized
            if (prev.length === 0) {
              const firstFive = gameToUse.yourTeam.players.slice(0, 5).map(p => p.id);
              return firstFive;
            }
            return prev;
          });
        }
      }
    }
  }, [gameId]);
  
  // Reload game when component becomes visible (e.g., navigating back from setup)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && gameId) {
        const loadedGame = getGame(gameId);
        if (loadedGame) {
          setGame(loadedGame);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameId]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time;
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setTime(elapsed);
      }, 10); // Update every 100ms for smooth milliseconds display
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, time]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10); // Show centiseconds (00-99)
    return (
      <>
        <span className="time-seconds">{totalSeconds}</span>
        <span className="time-milliseconds">.{ms.toString().padStart(2, '0')}</span>
      </>
    );
  };

  const toggleClock = () => {
    setIsRunning(!isRunning);
  };

  const adjustTime = (delta: number) => {
    // delta is in seconds, convert to milliseconds
    const deltaMs = delta * 1000;
    setTime(prev => Math.max(0, prev + deltaMs));
  };

  const incrementPasses = () => {
    setPasses(prev => prev + 1);
  };

  const decrementPasses = () => {
    setPasses(prev => Math.max(0, prev - 1));
  };

  const handleTurnover = (playerId?: string) => {
    if (!game) return;

    const result: OffenseResult = {
      type: 'turnover',
      playerId: playerId || undefined,
    };

    saveOffense(result);
    resetOffense();
  };

  const handleShot = () => {
    setShowShotOptions(true);
    setIsRunning(false);
  };

  const handleShotResult = (result: OffenseResult) => {
    if (!game) return;
    
    // Close modal and reset its state
    setShowShotOptions(false);
    setShotModalKey(prev => prev + 1); // Force remount to reset state
    
    // If offensive rebound, offense continues - don't save or reset
    if (result.type === 'miss' && result.offensiveRebound === true) {
      setIsRunning(true); // Continue the clock
      return;
    }
    
    // Otherwise, save the offense and reset
    saveOffense(result);
    resetOffense();
  };

  const saveOffense = (result: OffenseResult) => {
    if (!game || time === 0) return;

    const offense: Offense = {
      id: Date.now().toString(),
      time: Math.floor(time / 1000), // Store in seconds for compatibility
      passes,
      result,
      playersOnCourt: [...playersOnCourt],
      timestamp: Date.now(),
    };

    const updatedGame: Game = {
      ...game,
      offenses: [...game.offenses, offense],
    };

    saveGame(updatedGame);
    setGame(updatedGame);
  };

  const resetOffense = () => {
    setTime(0);
    setPasses(0);
    setIsRunning(false);
  };

  const togglePlayerOnCourt = (playerId: string) => {
    if (playersOnCourt.includes(playerId)) {
      setPlayersOnCourt(playersOnCourt.filter(id => id !== playerId));
    } else {
      if (playersOnCourt.length < 5) {
        setPlayersOnCourt([...playersOnCourt, playerId]);
      } else {
        alert('Maximum 5 players on court');
      }
    }
  };

  const getPlayersOnCourt = () => {
    if (!game) return [];
    return game.yourTeam.players.filter(p => playersOnCourt.includes(p.id));
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  if (showShotOptions) {
    return (
      <ShotOptionsModal
        key={shotModalKey}
        game={game}
        playersOnCourt={playersOnCourt}
        onSelect={handleShotResult}
        onCancel={() => {
          setShowShotOptions(false);
          setShotModalKey(prev => prev + 1);
          setIsRunning(true);
        }}
      />
    );
  }

  if (showTurnoverOptions) {
    return (
      <TurnoverModal
        game={game}
        playersOnCourt={playersOnCourt}
        onSelect={(playerId) => {
          handleTurnover(playerId);
          setShowTurnoverOptions(false);
        }}
        onCancel={() => {
          setShowTurnoverOptions(false);
          setIsRunning(true);
        }}
      />
    );
  }

  return (
    <div className="game-mode">
      <div className="game-mode-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Home
        </button>
        <div className="game-info">
          <h2>{game.yourTeam.name}</h2>
          <p>vs {game.opponentTeam.name}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary btn-icon"
            onClick={() => navigate(`/game/${gameId}/edit`)}
            title="Edit Game"
          >
            <EditIcon />
          </button>
          <button
            className="btn-view"
            onClick={() => navigate(`/game/${gameId}/view`)}
          >
            View Stats
          </button>
        </div>
      </div>

      <div className="clock-section">
        <div className="clock-display">
          <div className="clock-time-wrapper">
            <button
              className="btn-time-adjust"
              onClick={() => adjustTime(-1)}
              disabled={isRunning}
              title="Decrease by 1 second"
            >
              −
            </button>
            <div className="clock-time">{formatTime(time)}</div>
            <button
              className="btn-time-adjust"
              onClick={() => adjustTime(1)}
              disabled={isRunning}
              title="Increase by 1 second"
            >
              +
            </button>
          </div>
          <div className="clock-label">Offense Time</div>
        </div>
        <div className="clock-controls">
          <button
            className={`btn-clock ${isRunning ? 'btn-pause' : 'btn-start'}`}
            onClick={toggleClock}
          >
            {isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn-turnover"
          onClick={() => {
            setIsRunning(false);
            setShowTurnoverOptions(true);
          }}
        >
          Turnover
        </button>
        <button
          className="btn-shot"
          onClick={() => {
            setIsRunning(false);
            handleShot();
          }}
        >
          Shot
        </button>
      </div>

      <div className="passes-section">
        <div className="passes-display">
          <button
            className="btn-pass-decrease"
            onClick={decrementPasses}
            disabled={passes === 0}
            title="Decrease passes"
          >
            −
          </button>
          <div className="passes-count-wrapper">
            <div className="passes-count">{passes}</div>
            <div className="passes-label">Passes</div>
          </div>
          <button
            className="btn-pass"
            onClick={incrementPasses}
            title="Increase passes"
          >
            +
          </button>
        </div>
      </div>

      <div className="players-on-court-section">
        <h3>Players on Court ({playersOnCourt.length}/5)</h3>
        <div className="player-numbers-grid">
          {game.yourTeam.players.map((player) => {
            const onCourt = playersOnCourt.includes(player.id);
            return (
              <button
                key={player.id}
                className={`player-number-btn ${onCourt ? 'on-court' : 'on-bench'}`}
                onClick={() => {
                  if (!isRunning) {
                    togglePlayerOnCourt(player.id);
                  }
                }}
                disabled={isRunning && !onCourt}
              >
                <span className="player-number">{player.number}</span>
                <span className="player-name-small">{player.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="offenses-count">
        {game.offenses.length} offense{game.offenses.length !== 1 ? 's' : ''} tracked
      </div>
    </div>
  );
}

function ShotOptionsModal({
  game,
  playersOnCourt,
  onSelect,
  onCancel,
}: {
  game: Game;
  playersOnCourt: string[];
  onSelect: (result: OffenseResult) => void;
  onCancel: () => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [shotType, setShotType] = useState<2 | 3 | null>(null);
  const [resultType, setResultType] = useState<'score' | 'miss' | 'foul' | null>(null);
  const [offensiveRebound, setOffensiveRebound] = useState<boolean | null>(null);
  const [foulShots, setFoulShots] = useState<Array<{ made: boolean | undefined }>>([{ made: undefined }, { made: undefined }, { made: undefined }]);

  const playersOnCourtList = game.yourTeam.players.filter(p => playersOnCourt.includes(p.id));

  const handleScore = () => {
    onSelect({
      type: 'score',
      points: shotType!,
      playerId: selectedPlayer || undefined,
      shotType: shotType!,
    });
  };

  const handleMiss = () => {
    if (offensiveRebound === null) {
      setResultType('miss');
      return;
    }
    // This should not be reached anymore since we call onSelect directly from buttons
    // But keeping for safety
    onSelect({
      type: 'miss',
      playerId: selectedPlayer || undefined,
      shotType: shotType!,
      offensiveRebound: offensiveRebound,
    });
  };

  const handleFoul = () => {
    if (resultType !== 'foul') {
      setResultType('foul');
      return;
    }
    // Count how many shots were actually taken
    const shotsTaken = foulShots.filter(shot => shot.made !== undefined).length;
    if (shotsTaken === 0) {
      alert('Please indicate at least one free throw result');
      return;
    }
    // Only include shots that were actually taken
    const takenShots = foulShots.slice(0, shotsTaken).map(shot => ({
      made: shot.made as boolean, // We know it's not undefined because we filtered
    }));
    onSelect({
      type: 'foul',
      playerId: selectedPlayer || undefined,
      shotType: shotType!,
      foulShots: takenShots,
    });
  };

  const toggleFoulShot = (index: number, made: boolean | undefined) => {
    const newFoulShots = [...foulShots];
    if (newFoulShots[index].made === made) {
      // If clicking the same state, set to undefined (not taken)
      newFoulShots[index] = { made: undefined };
    } else {
      newFoulShots[index] = { made };
    }
    setFoulShots(newFoulShots);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Shot Attempt</h2>
        
        {shotType === null && (
          <>
            <div className="shot-type-selection">
              <h3>Shot Type</h3>
              <div className="shot-type-buttons">
                <button
                  className="btn-shot-type"
                  onClick={() => setShotType(2)}
                >
                  2-Point
                </button>
                <button
                  className="btn-shot-type"
                  onClick={() => setShotType(3)}
                >
                  3-Point
                </button>
              </div>
            </div>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}

        {shotType !== null && resultType === null && (
          <>
            <div className="player-assignment">
              <h3>Assign to Player (optional)</h3>
              <div className="player-buttons-grid">
                <button
                  className={`player-assign-btn ${selectedPlayer === '' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlayer('')}
                >
                  Team
                </button>
                {playersOnCourtList.map((player) => (
                  <button
                    key={player.id}
                    className={`player-assign-btn ${selectedPlayer === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlayer(player.id)}
                  >
                    <span className="player-number-small">#{player.number}</span>
                    <span>{player.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="result-type-selection">
              <h3>Result</h3>
              <div className="result-type-buttons">
                <button
                  className="btn-result-type score"
                  onClick={handleScore}
                >
                  Score
                </button>
                <button
                  className="btn-result-type miss"
                  onClick={handleMiss}
                >
                  Miss
                </button>
                <button
                  className="btn-result-type foul"
                  onClick={handleFoul}
                >
                  Foul
                </button>
              </div>
            </div>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}

        {resultType === 'miss' && offensiveRebound === null && (
          <>
            <div className="rebound-selection">
              <h3>Rebound</h3>
              <div className="rebound-buttons">
                <button
                  className="btn-rebound"
                  onClick={() => {
                    const isOffensive = true;
                    setOffensiveRebound(isOffensive);
                    // Close modal immediately and call onSelect
                    onSelect({
                      type: 'miss',
                      playerId: selectedPlayer || undefined,
                      shotType: shotType!,
                      offensiveRebound: isOffensive,
                    });
                  }}
                >
                  Offensive Rebound
                </button>
                <button
                  className="btn-rebound"
                  onClick={() => {
                    const isOffensive = false;
                    setOffensiveRebound(isOffensive);
                    // Close modal immediately and call onSelect
                    onSelect({
                      type: 'miss',
                      playerId: selectedPlayer || undefined,
                      shotType: shotType!,
                      offensiveRebound: isOffensive,
                    });
                  }}
                >
                  Defensive Rebound
                </button>
              </div>
            </div>
            <button className="btn-cancel" onClick={() => setResultType(null)}>
              Back
            </button>
          </>
        )}

        {resultType === 'foul' && (
          <>
            <div className="foul-shots-selection">
              <h3>Free Throws</h3>
              <p className="foul-shots-instruction">Tap each shot: Made (✓), Missed (✗), or Not Taken</p>
              <div className="foul-shots-list">
                {foulShots.map((shot, index) => (
                  <div key={index} className="foul-shot-item">
                    <span className="foul-shot-number">Shot {index + 1}</span>
                    <div className="foul-shot-buttons">
                      <button
                        className={`foul-shot-btn made ${shot.made === true ? 'selected' : ''}`}
                        onClick={() => toggleFoulShot(index, true)}
                      >
                        ✓ Made
                      </button>
                      <button
                        className={`foul-shot-btn missed ${shot.made === false ? 'selected' : ''}`}
                        onClick={() => toggleFoulShot(index, false)}
                      >
                        ✗ Missed
                      </button>
                      <button
                        className={`foul-shot-btn not-taken ${shot.made === undefined ? 'selected' : ''}`}
                        onClick={() => toggleFoulShot(index, undefined)}
                      >
                        Not Taken
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="foul-actions">
              <button
                className="btn-confirm-foul"
                onClick={handleFoul}
              >
                Confirm Foul
              </button>
              <button className="btn-cancel" onClick={() => setResultType(null)}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


function TurnoverModal({
  game,
  playersOnCourt,
  onSelect,
  onCancel,
}: {
  game: Game;
  playersOnCourt: string[];
  onSelect: (playerId?: string) => void;
  onCancel: () => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const playersOnCourtList = game.yourTeam.players.filter(p => playersOnCourt.includes(p.id));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Turnover</h2>
        <div className="player-assignment">
          <h3>Assign to Player (optional)</h3>
          <div className="player-buttons-grid">
            <button
              className={`player-assign-btn ${selectedPlayer === '' ? 'selected' : ''}`}
              onClick={() => setSelectedPlayer('')}
            >
              Team
            </button>
            {playersOnCourtList.map((player) => (
              <button
                key={player.id}
                className={`player-assign-btn ${selectedPlayer === player.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(player.id)}
              >
                <span className="player-number-small">#{player.number}</span>
                <span>{player.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="turnover-actions">
          <button
            className="btn-confirm-turnover"
            onClick={() => onSelect(selectedPlayer || undefined)}
          >
            Confirm Turnover
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

