import { Game, Team, Player } from './types';

const STORAGE_KEY = 'court-sense-games';
const TEAMS_STORAGE_KEY = 'court-sense-teams';

export const saveGames = (games: Game[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (error) {
    console.error('Failed to save games:', error);
  }
};

export const loadGames = (): Game[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load games:', error);
    return [];
  }
};

export const saveGame = (game: Game): void => {
  const games = loadGames();
  const index = games.findIndex(g => g.id === game.id);
  if (index >= 0) {
    games[index] = game;
  } else {
    games.push(game);
  }
  saveGames(games);
};

export const getGame = (gameId: string): Game | null => {
  const games = loadGames();
  return games.find(g => g.id === gameId) || null;
};

export const deleteGame = (gameId: string): void => {
  const games = loadGames();
  const filtered = games.filter(g => g.id !== gameId);
  saveGames(filtered);
};

// Team management functions
export const loadTeams = (): Team[] => {
  try {
    const data = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load teams:', error);
    return [];
  }
};

// Merge players from teams with the same name, keeping unique players by name
const mergeTeamPlayers = (teams: Team[]): Player[] => {
  const playerMap = new Map<string, Player>();
  teams.forEach(team => {
    team.players.forEach(player => {
      // Use player name as key to avoid duplicates
      if (!playerMap.has(player.name)) {
        playerMap.set(player.name, player);
      }
    });
  });
  return Array.from(playerMap.values());
};

export const saveTeam = (team: Team): void => {
  const teams = loadTeams();
  
  // Find all teams with the same name
  const teamsWithSameName = teams.filter(t => t.name === team.name);
  
  if (teamsWithSameName.length > 0) {
    // Merge players from all teams with the same name
    const allTeams = [...teamsWithSameName, team];
    const mergedPlayers = mergeTeamPlayers(allTeams);
    
    // Update the first team with merged players
    const firstTeamIndex = teams.findIndex(t => t.name === team.name);
    teams[firstTeamIndex] = {
      ...teams[firstTeamIndex],
      players: mergedPlayers,
    };
    
    // Remove other teams with the same name
    const filteredTeams = teams.filter((t, index) => 
      t.name !== team.name || index === firstTeamIndex
    );
    
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(filteredTeams));
    } catch (error) {
      console.error('Failed to save teams:', error);
    }
  } else {
    // New team name, just add it
    teams.push(team);
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    } catch (error) {
      console.error('Failed to save teams:', error);
    }
  }
};

export const getTeamByName = (name: string): Team | null => {
  const teams = loadTeams();
  const teamsWithName = teams.filter(t => t.name === name);
  
  if (teamsWithName.length === 0) return null;
  
  // Merge all teams with the same name
  const mergedPlayers = mergeTeamPlayers(teamsWithName);
  
  return {
    ...teamsWithName[0],
    players: mergedPlayers,
  };
};

export const getAllTeamNames = (): string[] => {
  const teams = loadTeams();
  const uniqueNames = new Set(teams.map(t => t.name).filter(Boolean));
  return Array.from(uniqueNames);
};

