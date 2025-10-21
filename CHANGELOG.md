# Changelog

All notable changes to the Roon Raycast Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-21

### Added

#### Core Infrastructure
- **Zone Persistence Service** - Remembers last-used zone per command with fallback to global last-used zone
- **Image Cache Service** - LRU cache for images with configurable size (default 50MB)
- **Settings Service** - Centralized settings management for user preferences
  - Seek step size (default: 10 seconds)
  - Volume step size (default: 5%)
  - Image cache enable/disable
  - Maximum cache size
  - Queue info display toggle

#### Transport Commands
- **Next Track** (`next-track`) - Skip to the next track
- **Previous Track** (`previous-track`) - Go back to the previous track
- **Stop** (`stop`) - Stop playback on the last-used zone
- **Pause All Zones** (`pause-all`) - Pause playback on all zones simultaneously
- **Toggle Loop** (`toggle-loop`) - Cycle through loop modes (off → all → one → off)
- **Toggle Radio** (`toggle-radio`) - Toggle auto-radio setting
- **Seek Forward** (`seek-forward`) - Skip forward by configured seconds (respects settings)
- **Seek Backward** (`seek-backward`) - Skip backward by configured seconds (respects settings)
- **Mute All** (`mute-all`) - Mute all zones
- **Unmute All** (`unmute-all`) - Unmute all zones

### Changed

#### Updated Dependencies
- `@raycast/api` from ^1.51.2 to ^1.103.3
- `@raycast/utils` from ^1.6.1 to ^2.2.1
- `typescript` from ^4.4.3 to ^5.6.3
- `@types/react` from 18.0.9 to ^19.0.6
- `@types/node` from 18.8.3 to ^22.10.2
- Added `react` ^19.0.0 (explicit dependency)
- Node.js requirement updated to >=22.0.0

#### Testing Infrastructure
- Added `vitest` ^2.1.8 for unit testing
- Added `@testing-library/react` ^16.1.0
- Added `@testing-library/jest-dom` ^6.6.3
- Created test setup and configuration

#### Improved Existing Commands
- **Toggle Play** - Now uses zone persistence and shows user-friendly HUD messages
- **Play** - Added zone persistence, removed hardcoded zone index
- **Pause** - Added zone persistence, removed hardcoded zone index
- All commands now have:
  - Comprehensive error handling with Toast notifications
  - Zone persistence to remember last-used zone
  - User-friendly HUD feedback with emojis
  - Proper TypeScript type annotations

#### TypeScript & Build Configuration
- Updated TypeScript configuration to ES2022
- Updated tsconfig target to Node 22
- Added RoonApiBrowse to RoonCore services type definition
- Fixed browse command TypeScript errors
- Added proper type definitions for browse() and load() methods

#### Package.json
- Added descriptions to all commands
- Added test script: `npm test`
- Added engines field specifying Node.js >=22.0.0

### Fixed
- Removed hardcoded zone indices (zones[0], zones[2]) from existing commands
- Fixed TypeScript errors in browse.tsx
- Fixed import paths for relocated command files
- Added proper null checks for core service access

## [1.0.0] - 2023-05-18

### Initial Features
- Basic transport controls (play, pause, toggle-play)
- Zone listing and selection
- Basic browse functionality
- Roon core connection management