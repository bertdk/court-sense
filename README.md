# Court Sense - Basketball Statistics Tracker

A mobile-friendly web application for tracking alternative basketball statistics, including offense time, passes per offense, and shots per player.

## Features

- **Game Management**: Create and manage multiple games
- **Team Setup**: Define your team with players and opponent team
- **Game Mode**: 
  - Clock to track offense time (start, pause, adjust)
  - Pass counter with increment/decrement
  - Player management (bench vs court)
  - Track shots and turnovers
  - Shot follow-up options (score, miss, foul, rebounds)
- **View Mode**: 
  - **List View**: All offenses with time, passes, and results
  - **Dashboard**: Team totals and averages
  - **Summary**: Stats per player group combinations
- **Local Storage**: All data persists locally in browser storage

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Create a Game**: Click "Create New Game" on the home screen
2. **Setup**: Enter your team name, opponent name, game date, and add players
3. **Play**: 
   - Start the clock when an offense begins
   - Track passes as they occur
   - Manage players on court/bench when clock is paused
   - Record shots or turnovers to end the offense
4. **View Stats**: Access from home screen or during game (when clock is paused) to see:
   - List of all offenses
   - Team dashboard with totals and averages
   - Summary by player groups

## Technology Stack

- React 18
- TypeScript
- Vite
- React Router
- Local Storage API

## Browser Support

Works on modern browsers with local storage support. Optimized for mobile devices.

