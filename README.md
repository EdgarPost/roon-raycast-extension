# Roon for Raycast

Control your Roon music system directly from Raycast. Play, pause, skip tracks, browse your library, and manage multiple zones with ease.

![Raycast](https://img.shields.io/badge/Raycast-Extension-red)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Transport Controls
- **Toggle Play/Pause** - Quick play/pause toggle on your last-used zone
- **Play** - Start playback
- **Pause** - Pause playback
- **Stop** - Stop playback completely
- **Next Track** - Skip to the next track
- **Previous Track** - Go back to the previous track
- **Seek Forward** - Jump forward by configurable seconds (default: 10s)
- **Seek Backward** - Jump backward by configurable seconds (default: 10s)

### Zone Management
- **Zones View** - See all your Roon zones at a glance
  - Real-time playback status
  - Album artwork
  - Track information (title, artist, album)
  - Playback position and duration
  - Volume controls per output
  - Keyboard shortcuts for quick actions
- **Zone Persistence** - Remembers your last-used zone per command
- **Multiple Zone Control** - Control different zones independently

### Playback Settings
- **Toggle Loop** - Cycle through loop modes (off → all → one → off)
- **Toggle Shuffle** - Enable/disable shuffle mode
- **Toggle Radio** - Toggle Roon Radio (auto-play similar music)
- **Mute/Unmute All** - Quickly mute or unmute all zones

### Library Browsing
- **Browse** - Navigate your Roon library hierarchy
- Search and filter your music collection

## Installation

### Prerequisites
- [Raycast](https://raycast.com/) installed
- [Roon](https://roonlabs.com/) server running on your network
- Node.js ≥ 22.0.0

### From Raycast Store
1. Open Raycast
2. Search for "Roon"
3. Click "Install"

### Manual Installation
```bash
git clone https://github.com/EdgarPost/roon-raycast-extension
cd roon-raycast-extension
npm install
npm run build
```

## Setup

1. **First Launch**: When you first run any Roon command, the extension will attempt to connect to your Roon Core
2. **Authorization**: Go to your Roon app → Settings → Extensions and authorize "Raycast"
3. **Start Using**: Once authorized, all commands will work seamlessly

## Usage

### Quick Commands

All commands are available through Raycast's command palette. Simply type the command name:

- `Toggle Play` - Play/pause on last-used zone
- `Next Track` - Skip forward
- `Previous Track` - Skip back
- `Zones` - View and control all zones
- `Browse` - Browse your music library

### Keyboard Shortcuts (in Zones view)

- `⌘←` - Previous track
- `⌘→` - Next track
- `⌘U` - Increase volume
- `⌘D` - Decrease volume

### Zone Persistence

The extension remembers which zone you used for each command type. For example:
- If you use "Toggle Play" on Zone A, future "Toggle Play" commands will use Zone A
- If you use "Next Track" on Zone B, future "Next Track" commands will use Zone B
- Each command maintains its own zone preference

### Settings (Future Feature)

Configurable options will include:
- Seek step size (seconds)
- Volume step size (percentage)
- Image cache settings
- Queue information display

## Commands Reference

| Command | Description | Mode |
|---------|-------------|------|
| Toggle Play | Toggle play/pause on last-used zone | No-View |
| Play | Start playback | No-View |
| Pause | Pause playback | No-View |
| Stop | Stop playback | No-View |
| Next Track | Skip to next track | No-View |
| Previous Track | Go to previous track | No-View |
| Seek Forward | Skip forward by configured seconds | No-View |
| Seek Backward | Skip backward by configured seconds | No-View |
| Toggle Loop | Cycle through loop modes | No-View |
| Toggle Shuffle | Toggle shuffle mode | No-View |
| Toggle Radio | Toggle Roon Radio | No-View |
| Mute All | Mute all zones | No-View |
| Unmute All | Unmute all zones | No-View |
| Pause All Zones | Pause all zones | No-View |
| Zones | View and control all zones | View |
| Browse | Browse music library | View |

## Development

### Requirements
- Node.js ≥ 22.0.0
- npm or yarn

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/EdgarPost/roon-raycast-extension
cd roon-raycast-extension

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Build
```bash
# Build for production
npm run build

# Lint and fix issues
npm run fix-lint
```

## Architecture

### Core Services

- **Zone Persistence Service** - Tracks last-used zone per command with LocalStorage
- **Image Cache Service** - LRU cache for album artwork (default 50MB)
- **Settings Service** - Manages user preferences and configuration

### Technology Stack

- **React 19** - UI framework
- **TypeScript 5.6** - Type safety
- **Raycast API** - Extension framework
- **Roon API** - Music system integration
- **Vitest** - Testing framework

## Troubleshooting

### Extension won't connect to Roon
1. Ensure your Roon Core is running
2. Check that you're on the same network as your Roon Core
3. Verify the extension is authorized in Roon Settings → Extensions

### Commands not responding
1. Try restarting Raycast
2. Check if your Roon Core is online
3. Reauthorize the extension in Roon settings

### No zones showing up
1. Ensure you have at least one active zone in Roon
2. Try playing something in the Roon app first
3. Restart the Raycast extension

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use conventional commits

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

- Built with [Raycast](https://raycast.com/)
- Powered by [Roon Labs API](https://github.com/roonlabs)

## Support

- [Report Issues](https://github.com/EdgarPost/roon-raycast-extension/issues)
- [Request Features](https://github.com/EdgarPost/roon-raycast-extension/issues/new)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.