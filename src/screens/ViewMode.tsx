import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, Offense } from '../types';
import { getGame, saveGame } from '../storage';
import './ViewMode.css';

type ViewType = 'list' | 'dashboard' | 'summary';

export default function ViewMode() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [viewType, setViewType] = useState<ViewType>('dashboard');

  useEffect(() => {
    const loadGame = () => {
      if (gameId) {
        const loadedGame = getGame(gameId);
        if (loadedGame) {
          setGame(loadedGame);
        }
      }
    };
    
    loadGame();
    
    // Reload when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadGame();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameId]);

  if (!game) {
    return <div>Loading...</div>;
  }

  return (
    <div className="view-mode">
      <div className="view-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Home
        </button>
        <div className="view-title">
          <h1>{game.yourTeam.name}</h1>
          <p>vs {game.opponentTeam.name}</p>
        </div>
        <button
          className="btn-play"
          onClick={() => navigate(`/game/${gameId}/play`)}
        >
          Play
        </button>
      </div>

      <div className="view-tabs">
        <button
          className={`tab ${viewType === 'list' ? 'active' : ''}`}
          onClick={() => setViewType('list')}
        >
          List
        </button>
        <button
          className={`tab ${viewType === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewType('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${viewType === 'summary' ? 'active' : ''}`}
          onClick={() => setViewType('summary')}
        >
          Summary
        </button>
      </div>

      <div className="view-content">
        {viewType === 'list' && <ListView game={game} setGame={setGame} />}
        {viewType === 'dashboard' && <DashboardView game={game} />}
        {viewType === 'summary' && <SummaryView game={game} />}
      </div>
    </div>
  );
}

function ListView({ game, setGame }: { game: Game; setGame: (game: Game) => void }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResultLabel = (offense: Offense) => {
    const { result } = offense;
    if (result.type === 'turnover') return 'Turnover';
    if (result.type === 'score') {
      const shotType = result.shotType ? `${result.shotType}-pt ` : '';
      return `${shotType}Score (${result.points} pts)`;
    }
    if (result.type === 'foul') {
      const shotsCount = result.foulShots?.length || 0;
      const madeCount = result.foulShots?.filter(s => s.made === true).length || 0;
      return `Foul (${madeCount}/${shotsCount} FTs)`;
    }
    if (result.type === 'miss') {
      const shotType = result.shotType ? `${result.shotType}-pt ` : '';
      const rebound = result.offensiveRebound ? ' (OR)' : '';
      return `${shotType}Miss${rebound}`;
    }
    return 'Unknown';
  };

  const removeOffense = (offenseId: string) => {
    if (confirm('Are you sure you want to remove this offense?')) {
      const updatedOffenses = game.offenses.filter(o => o.id !== offenseId);
      const updatedGame: Game = {
        ...game,
        offenses: updatedOffenses,
      };
      saveGame(updatedGame);
      setGame(updatedGame);
    }
  };

  return (
    <div className="list-view">
      {game.offenses.length === 0 ? (
        <div className="empty-state">
          <p>No offenses tracked yet. Start a game to begin tracking!</p>
        </div>
      ) : (
        <div className="offenses-list">
          {game.offenses.map((offense, index) => (
            <div key={offense.id} className="offense-item">
              <div className="offense-header">
                <span className="offense-number">#{index + 1}</span>
                <span className="offense-time">{formatTime(offense.time)}</span>
                <button
                  className="btn-remove-offense"
                  onClick={() => removeOffense(offense.id)}
                  title="Remove offense"
                >
                  ×
                </button>
              </div>
              <div className="offense-details">
                <div className="offense-stat">
                  <span className="label">Passes:</span>
                  <span className="value">{offense.passes}</span>
                </div>
                <div className="offense-stat">
                  <span className="label">Result:</span>
                  <span className={`value result-${offense.result.type}`}>
                    {getResultLabel(offense)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardView({ game }: { game: Game }) {
  const offenses = game.offenses;
  const totalOffenses = offenses.length;
  const totalTime = offenses.reduce((sum, o) => sum + o.time, 0);
  const totalPasses = offenses.reduce((sum, o) => sum + o.passes, 0);
  const avgTime = totalOffenses > 0 ? totalTime / totalOffenses : 0;
  const avgPasses = totalOffenses > 0 ? totalPasses / totalOffenses : 0;

  const turnovers = offenses.filter(o => o.result.type === 'turnover').length;
  const scores = offenses.filter(o => o.result.type === 'score').length;
  const fouls = offenses.filter(o => o.result.type === 'foul').length;
  const misses = offenses.filter(o => o.result.type === 'miss').length;

  const totalPoints = offenses
    .filter(o => o.result.type === 'score')
    .reduce((sum, o) => sum + (o.result.points || 0), 0) +
    offenses
      .filter(o => o.result.type === 'foul')
      .reduce((sum, o) => {
        const madeShots = o.result.foulShots?.filter(s => s.made === true).length || 0;
        return sum + madeShots;
      }, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate individual player stats
  const calculatePlayerStats = () => {
    const playerStats = new Map<string, {
      name: string;
      offenses: Offense[];
      totalPasses: number;
      totalTime: number;
      scores: number;
      turnovers: number;
      twoPointAttempts: number;
      twoPointScores: number;
      threePointAttempts: number;
      threePointScores: number;
    }>();

    // Initialize all players
    game.yourTeam.players.forEach(player => {
      playerStats.set(player.id, {
        name: player.name,
        offenses: [],
        totalPasses: 0,
        totalTime: 0,
        scores: 0,
        turnovers: 0,
        twoPointAttempts: 0,
        twoPointScores: 0,
        threePointAttempts: 0,
        threePointScores: 0,
      });
    });

    // Team stats (unassigned)
    const teamStats = {
      name: 'Team',
      offenses: [] as Offense[],
      totalPasses: 0,
      totalTime: 0,
      scores: 0,
      turnovers: 0,
      twoPointAttempts: 0,
      twoPointScores: 0,
      threePointAttempts: 0,
      threePointScores: 0,
    };

    // Process each offense
    offenses.forEach(offense => {
      const playerId = offense.result.playerId;
      const stats = playerId ? playerStats.get(playerId) : teamStats;

      if (stats) {
        stats.offenses.push(offense);
        stats.totalPasses += offense.passes;
        stats.totalTime += offense.time;

        if (offense.result.type === 'score') {
          stats.scores++;
          if (offense.result.shotType === 2) {
            stats.twoPointAttempts++;
            stats.twoPointScores++;
          } else if (offense.result.shotType === 3) {
            stats.threePointAttempts++;
            stats.threePointScores++;
          }
        } else if (offense.result.type === 'turnover') {
          stats.turnovers++;
        } else if (offense.result.type === 'miss' || offense.result.type === 'foul') {
          // Count as attempt if it was a shot (has shotType)
          if (offense.result.shotType === 2) {
            stats.twoPointAttempts++;
          } else if (offense.result.shotType === 3) {
            stats.threePointAttempts++;
          }
        }
      }
    });

    return { playerStats, teamStats };
  };

  const { playerStats, teamStats } = calculatePlayerStats();

  // Calculate totals
  const totalStats = {
    name: 'Total',
    offenses: offenses.length,
    totalPasses,
    totalTime,
    scores,
    turnovers,
    twoPointAttempts: Array.from(playerStats.values()).reduce((sum, s) => sum + s.twoPointAttempts, 0) + teamStats.twoPointAttempts,
    twoPointScores: Array.from(playerStats.values()).reduce((sum, s) => sum + s.twoPointScores, 0) + teamStats.twoPointScores,
    threePointAttempts: Array.from(playerStats.values()).reduce((sum, s) => sum + s.threePointAttempts, 0) + teamStats.threePointAttempts,
    threePointScores: Array.from(playerStats.values()).reduce((sum, s) => sum + s.threePointScores, 0) + teamStats.threePointScores,
  };

  return (
    <div className="dashboard-view">
      <div className="dashboard-section">
        <h2>Individual Stats</h2>
        {totalOffenses === 0 ? (
          <p className="empty-text">No offenses tracked yet. Start a game to see individual stats!</p>
        ) : (
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Avg Passes</th>
                  <th>Avg Time</th>
                  <th>Score %</th>
                  <th>Turnovers</th>
                  <th>2P</th>
                  <th>3P</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(playerStats.values())
                  .filter(s => s.offenses.length > 0)
                  .map((stats) => {
                    const avgPasses = stats.offenses.length > 0 ? stats.totalPasses / stats.offenses.length : 0;
                    const avgTime = stats.offenses.length > 0 ? stats.totalTime / stats.offenses.length : 0;
                    const scorePercentage = stats.offenses.length > 0 ? (stats.scores / stats.offenses.length * 100) : 0;
                    return (
                      <tr key={stats.name}>
                        <td>{stats.name}</td>
                        <td>{avgPasses.toFixed(1)}</td>
                        <td>{formatTime(Math.round(avgTime))}</td>
                        <td>{scorePercentage.toFixed(1)}%</td>
                        <td>{stats.turnovers}</td>
                        <td>{stats.twoPointScores}/{stats.twoPointAttempts}</td>
                        <td>{stats.threePointScores}/{stats.threePointAttempts}</td>
                      </tr>
                    );
                  })}
                {teamStats.offenses.length > 0 && (
                  <tr className="team-row">
                    <td>{teamStats.name}</td>
                    <td>{(teamStats.totalPasses / teamStats.offenses.length).toFixed(1)}</td>
                    <td>{formatTime(Math.round(teamStats.totalTime / teamStats.offenses.length))}</td>
                    <td>{(teamStats.scores / teamStats.offenses.length * 100).toFixed(1)}%</td>
                    <td>{teamStats.turnovers}</td>
                    <td>{teamStats.twoPointScores}/{teamStats.twoPointAttempts}</td>
                    <td>{teamStats.threePointScores}/{teamStats.threePointAttempts}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td><strong>{totalStats.name}</strong></td>
                  <td><strong>{avgPasses.toFixed(1)}</strong></td>
                  <td><strong>{formatTime(Math.round(avgTime))}</strong></td>
                  <td><strong>{(scores / totalOffenses * 100).toFixed(1)}%</strong></td>
                  <td><strong>{turnovers}</strong></td>
                  <td><strong>{totalStats.twoPointScores}/{totalStats.twoPointAttempts}</strong></td>
                  <td><strong>{totalStats.threePointScores}/{totalStats.threePointAttempts}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Team Totals</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalOffenses}</div>
            <div className="stat-label">Total Offenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatTime(totalTime)}</div>
            <div className="stat-label">Total Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalPasses}</div>
            <div className="stat-label">Total Passes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalPoints}</div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Team Averages</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{formatTime(Math.round(avgTime))}</div>
            <div className="stat-label">Avg Time/Offense</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgPasses.toFixed(1)}</div>
            <div className="stat-label">Avg Passes/Offense</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Results Breakdown</h2>
        <div className="results-list">
          <div className="result-item">
            <span className="result-label">Scores:</span>
            <span className="result-value">{scores}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Misses:</span>
            <span className="result-value">{misses}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Fouls:</span>
            <span className="result-value">{fouls}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Turnovers:</span>
            <span className="result-value">{turnovers}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryView({ game }: { game: Game }) {
  // Group offenses by player combinations
  const playerGroups = new Map<string, {
    players: string[];
    offenses: Offense[];
  }>();

  game.offenses.forEach(offense => {
    const key = offense.playersOnCourt.sort().join(',');
    if (!playerGroups.has(key)) {
      playerGroups.set(key, {
        players: offense.playersOnCourt,
        offenses: [],
      });
    }
    playerGroups.get(key)!.offenses.push(offense);
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (playerId: string) => {
    const player = game.yourTeam.players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  return (
    <div className="summary-view">
      {playerGroups.size === 0 ? (
        <div className="empty-state">
          <p>No player groups tracked yet. Start tracking offenses to see stats!</p>
        </div>
      ) : (
        Array.from(playerGroups.entries()).map(([key, group]) => {
          const totalTime = group.offenses.reduce((sum, o) => sum + o.time, 0);
          const totalPasses = group.offenses.reduce((sum, o) => sum + o.passes, 0);
          const avgTime = group.offenses.length > 0 ? totalTime / group.offenses.length : 0;
          const avgPasses = group.offenses.length > 0 ? totalPasses / group.offenses.length : 0;
          const scores = group.offenses.filter(o => o.result.type === 'score').length;
          const turnovers = group.offenses.filter(o => o.result.type === 'turnover').length;

          return (
            <div key={key} className="player-group-card">
              <h3>Player Group</h3>
              <div className="group-players">
                {group.players.map(playerId => (
                  <span key={playerId} className="player-tag">
                    {getPlayerName(playerId)}
                  </span>
                ))}
              </div>
              <div className="group-stats">
                <div className="group-stat">
                  <span className="label">Offenses:</span>
                  <span className="value">{group.offenses.length}</span>
                </div>
                <div className="group-stat">
                  <span className="label">Avg Time:</span>
                  <span className="value">{formatTime(Math.round(avgTime))}</span>
                </div>
                <div className="group-stat">
                  <span className="label">Avg Passes:</span>
                  <span className="value">{avgPasses.toFixed(1)}</span>
                </div>
                <div className="group-stat">
                  <span className="label">Scores:</span>
                  <span className="value">{scores}</span>
                </div>
                <div className="group-stat">
                  <span className="label">Turnovers:</span>
                  <span className="value">{turnovers}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

