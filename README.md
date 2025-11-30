# Court Sense - Basketball Statistics Tracker

A mobile-friendly web application for tracking alternative basketball statistics, including offense time, passes per offense, and shots per player. All data is stored locally in your browser.

## Features

### Game Management
- **Create Games**: Set up new games with team names, players, and opponent information
- **Team Reuse**: Select from existing teams when creating new games - all players are automatically prefilled
- **Edit Games**: Modify team information and player lists even after a game has started
- **Delete Games**: Remove games you no longer need
- **Team Merging**: Teams with the same name automatically merge all their players

### Game Setup
- **Team Configuration**: Define your team name and add players with jersey numbers
- **Player Numbers**: Each player gets a unique number (starting from 4 by default)
- **Opponent Setup**: Set opponent team name and game date
- **Quick Team Selection**: Choose existing teams from a dropdown - game is created automatically

### Game Mode
- **Offense Clock**: Track time for each offense with start/pause controls and +/- buttons for adjustment
- **Time Display**: Shows seconds with milliseconds in smaller font (e.g., 45.23)
- **Pass Tracking**: Increment/decrement pass counter during active offense
- **Player Management**: Click player numbers to toggle between court and bench (max 5 on court)
- **Action Tracking**: 
  - Record turnovers (assignable to specific players or team)
  - Record shots with detailed follow-up:
    - Choose 2-point or 3-point attempt
    - Select result: Score, Miss, or Foul
    - For misses: Track offensive or defensive rebound
    - For fouls: Track up to 3 free throws (made/missed/not taken)
- **Offensive Rebounds**: Continue offense after offensive rebound without resetting

### View Mode (Dashboard, List, Summary)
- **Dashboard View** (Default):
  - Team totals and averages
  - Results breakdown
  - **Individual Stats Table**: 
    - Per-player statistics: avg passes, avg time, score percentage, turnovers
    - 2-point and 3-point shooting (scores/attempts format)
    - Team row for unassigned actions
    - Total row with aggregated stats
- **List View**: 
  - All offenses with time, passes, and results
  - Remove individual offenses
- **Summary View**: 
  - Stats grouped by player combinations who played together

### Data Persistence
- **Local Storage**: All game data, teams, and offenses are saved locally
- **Auto-save**: Changes are saved automatically as you work
- **No Backend Required**: Everything works offline

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install pnpm (if not already installed):
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with UI mode
pnpm test:ui
```

## Usage Guide

### Creating a Game

1. Click "Create New Game" on the home screen
2. If you have existing teams, select one from the dropdown (game is created automatically)
3. Or click "Create New Team" to start fresh
4. Enter team name, opponent name, and game date
5. Add players (they'll get numbers automatically starting from 4)
6. Click "Start Game" when ready

### During a Game

1. **Start Offense**: Click "Start" to begin tracking an offense
2. **Track Passes**: Use +/- buttons to count passes (works while clock is running)
3. **Manage Players**: When clock is paused, click player numbers to toggle court/bench
4. **Record Actions**:
   - **Shot**: Choose 2pt/3pt → Select result → Handle rebounds/fouls if needed
   - **Turnover**: Assign to player or leave as team action
5. **Continue or Reset**: After recording an action, offense resets (except offensive rebounds)

### Viewing Statistics

1. Access from home screen or during game (when clock is paused)
2. **Dashboard** (default): See team totals, averages, and individual player stats table
3. **List**: Browse all offenses, remove unwanted entries
4. **Summary**: Analyze performance by player group combinations

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Navigation
- **Playwright**: End-to-end testing
- **Local Storage API**: Data persistence

## Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/court-sense.git
cd court-sense
```

3. Install dependencies:
```bash
pnpm install
```

4. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

5. Make your changes and test them:
```bash
pnpm dev        # Start dev server
pnpm test       # Run tests
```

6. Commit your changes:
```bash
git commit -m "Add: description of your feature"
```

7. Push and create a Pull Request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components focused and reusable
- Write tests for new features
- Ensure mobile-friendly responsive design

### Testing

- Write Playwright tests for new features
- Ensure existing tests pass
- Test on mobile devices when possible

## Browser Support

Works on modern browsers with local storage support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Optimized for mobile devices with touch-friendly controls.

## License

This project is open source and available for personal and educational use.

