# Poker Shot Clock App

A modern web application for managing poker game timers with configurable time limits, time banks, and multiple display modes. Features real-time backend synchronization for multi-device gaming sessions.

## Features

### 🎮 Game Management
- **Configurable Time Limits**: Set custom time limits for each player's turn (10-300 seconds)
- **Time Bank System**: Each player gets a limited number of time bank uses to extend their turn by 30 seconds (adds to current time)
- **Player Management**: Support for 2-10 players with customizable names
- **Auto-Advance**: Automatically moves to the next player when time runs out
- **Session Management**: Create and join game sessions with unique identifiers
- **Real-time Sync**: All devices stay synchronized via backend server
- **Password Protection**: Optional admin password for session security
- **Role-Based Access**: Admin mode for full control, Player mode for view-only access

### 👥 Multiple Modes
- **Admin Dashboard**: Comprehensive admin interface with all players on one page
  - Edit player names in real-time
  - Move players up/down in seating order
  - Set any player as current player
  - Reset individual player timers
  - Manage time banks per player
  - Delete sessions and disconnect all players
- **Player Mode**: View-only access to game state (no admin controls)
- **Display Screen**: Full-screen view showing all players and current game status
- **Session Manager**: Create and join game sessions with device tracking and logging

### 🎨 Modern UI
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live timer updates with visual feedback
- **Color-coded Alerts**: Visual warnings when time is running low
- **Dark Theme**: Easy on the eyes for extended gaming sessions

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Cursor-Poker
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run dev:server
```

4. Start the frontend development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Getting Started
1. **Create Session**: Go to "Session Management" and create a new session with a unique ID
2. **Set Admin Password** (Optional): Add password protection for admin access
3. **Configure Game**: Set up players, time limits, and time banks during session creation
4. **Share Session ID**: Share the session ID (and admin password if set) with players
5. **Join Session**: 
   - **Admins**: Join with the admin password to access admin dashboard
   - **Players**: Join without password for view-only access
6. **Start Playing**: Use Admin Dashboard to control the game

### Session Management
- **Create New Session**: Set up a new game with custom settings
- **Join Existing Session**: Connect to an existing game using session ID
- **Edit Settings**: Modify game configuration anytime from the session manager
- **No Separate Settings**: All configuration is done through session management

### Admin Dashboard
- **Game Controls**: Start, pause, reset, and control the overall game flow
- **Player Management**: 
  - Edit player names by clicking the edit icon
  - Move players up/down using arrow buttons
  - Set any player as current player with "Set Current" button
  - Reset individual player timers
  - Use time banks for any player
- **Current Player Status**: Prominent display of the active player with quick actions
- **Session Management**: Delete sessions and disconnect all players
- **Real-time Updates**: All changes are immediately reflected across all connected devices

### Player Mode
- **View-Only Access**: Players can see the game state but cannot control it
- **Display Integration**: Use the display screen to see the overall game
- **No Admin Controls**: Players cannot start, pause, or modify the game

### Display Screen
- **Full-Screen View**: Shows all players simultaneously
- **Current Player Highlight**: Prominently displays the active player
- **Real-time Updates**: Live updates of all timers and time banks
- **Game Status**: Shows whether the game is running, paused, or stopped

## Local Network Usage

This app is designed for local network use without internet access:

1. **Start the development server** on your main computer
2. **Access from other devices** on the same network using your computer's IP address
3. **Multiple displays**: Open the display screen on a separate monitor or device
4. **Admin control**: Use the main interface on your computer for game control

### Network Access
To access from other devices on your local network:
1. Find your computer's IP address (e.g., `192.168.1.100`)
2. Access the app from other devices at `http://192.168.1.100:5173`

## Keyboard Shortcuts

- **Spacebar**: Start/Pause game (in admin mode)
- **N**: Next player (in admin mode)
- **R**: Reset game (in admin mode)
- **D**: Open display screen
- **S**: Open settings

## Technical Details

### Built With
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Express.js**: Backend server for session management
- **Socket.IO**: Real-time communication between devices
- **Context API**: State management without external dependencies

### Project Structure
```
src/
├── components/          # React components
│   ├── Timer.tsx       # Main timer interface
│   ├── Settings.tsx    # Game configuration
│   └── DisplayScreen.tsx # Full-screen display
├── context/            # React context for state management
│   └── GameContext.tsx # Game state and logic
├── types/              # TypeScript type definitions
│   └── index.ts        # Game-related types
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Customization

### Styling
The app uses Tailwind CSS with custom poker-themed colors:
- `poker-green`: #2d5a27 (success states)
- `poker-red`: #dc2626 (danger/warning states)
- `poker-gold`: #fbbf24 (accent color)
- `poker-dark`: #1f2937 (background)

### Adding Features
The modular architecture makes it easy to add new features:
- Add new components in the `components/` directory
- Extend the game state in `context/GameContext.tsx`
- Add new types in `types/index.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on the repository or contact the development team.

## Environment Configuration

Before running or deploying, create a `.env` file in the project root with the following variables:

```
VITE_API_BASE=http://localhost:3001
VITE_APP_DOMAIN=cdpshotclock.local
PROJECT_ROOT=/path/to/your/project
```

Replace `/path/to/your/project` and domain as needed for your environment.
