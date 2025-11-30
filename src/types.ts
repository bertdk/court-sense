export interface Player {
  id: string;
  name: string;
  number: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface FoulShot {
  made: boolean; // true = scored, false = missed, undefined = not taken
}

export interface OffenseResult {
  type: 'turnover' | 'score' | 'foul' | 'miss';
  points?: number; // For score
  playerId?: string; // For turnover or shot
  shotType?: 2 | 3; // 2-point or 3-point attempt
  offensiveRebound?: boolean; // If miss, was there an offensive rebound (continues offense)
  foulShots?: FoulShot[]; // For fouls: array of free throw results
}

export interface Offense {
  id: string;
  time: number; // Time in seconds
  passes: number;
  result: OffenseResult;
  playersOnCourt: string[]; // Player IDs
  timestamp: number;
}

export interface Game {
  id: string;
  yourTeam: Team;
  opponentTeam: { name: string };
  date: string;
  offenses: Offense[];
  currentQuarter?: number; // 1-4 = quarters, 5+ = overtime periods
  yourTeamScore?: number;
  opponentScore?: number;
}

