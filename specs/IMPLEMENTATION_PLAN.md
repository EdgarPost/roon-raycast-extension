# Roon Raycast Extension - Complete Implementation Plan

**Version:** 1.0
**Date:** 2025-10-21
**Status:** Planning
**Session ID:** 011CUKueHpdo2gd7PpyDSAK2

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Requirements](#technical-requirements)
3. [Architecture Decisions](#architecture-decisions)
4. [Implementation Phases](#implementation-phases)
5. [Feature Specifications](#feature-specifications)
6. [Testing Strategy](#testing-strategy)
7. [Commit Strategy](#commit-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Roon API Reference](#roon-api-reference)

---

## Project Overview

### Goal
Complete the Roon Raycast Extension by implementing all available Roon API services and following Raycast best practices for 2025.

### Scope
- **In Scope:** All Roon services that the extension consumes (Transport, Browse, Image, Status)
- **Out of Scope:** Services the extension provides to Roon (VolumeControl, SourceControl providers)

### Current State
- Basic transport controls (play, pause, toggle-play, toggle-shuffle)
- Zone listing with basic controls
- Incomplete browse functionality
- Outdated dependencies (React 18, TypeScript 4.4.3)
- No tests
- No settings/configuration

### Target State
- Complete transport control suite
- Advanced browse with hierarchy navigation and search
- Settings for user preferences
- Modern dependencies (React 19, Node 22, latest Raycast API)
- Basic test coverage with Vitest
- Last-used zone persistence
- Image caching for performance
- Comprehensive error handling

---

## Technical Requirements

### Dependencies Update

**Current:**
```json
{
  "@raycast/api": "^1.51.2",
  "@raycast/utils": "^1.6.1",
  "typescript": "^4.4.3",
  "@types/react": "18.0.9"
}
```

**Target:**
```json
{
  "@raycast/api": "latest",
  "@raycast/utils": "latest",
  "typescript": "^5.6.0",
  "@types/react": "^19.0.0",
  "react": "^19.0.0"
}
```

**Add:**
```json
{
  "vitest": "latest",
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "node-roon-api-settings": "github:roonlabs/node-roon-api-settings"
}
```

### TypeScript Configuration
- Update to ES2022 or later
- Ensure strict mode remains enabled
- Add paths for easier imports (optional)

### Node.js Version
- Target: Node 22 (Raycast 2025 standard)
- Update package.json engines field

---

## Architecture Decisions

### 1. Command Organization (Hybrid Approach)

**No-View Commands** (Quick Actions):
- Common operations that execute immediately with HUD feedback
- Examples: toggle-play, next-track, previous-track, pause-all

**View Commands** (Interactive):
- Complex operations requiring selection or browsing
- Examples: zones (full zone management), browse (library navigation), search

### 2. Zone Persistence (Last-Used Zone Per Command)

**Implementation:**
- Store last-used zone per command type in LocalStorage
- Format: `lastZone:{commandName}` → `zone_id`
- Fallback hierarchy:
  1. Last-used zone for this command
  2. Last-used zone globally
  3. First available zone
  4. Prompt user if no zones available

**Storage Schema:**
```typescript
{
  "lastZone:play": "zone_abc123",
  "lastZone:pause": "zone_abc123",
  "lastZone:toggle-play": "zone_def456",
  "lastZone:global": "zone_abc123"
}
```

### 3. Settings Service

**Configuration Options:**
```typescript
{
  defaultZone?: string,           // Optional default zone ID
  seekStepSeconds: number,         // Default: 10
  volumeStepPercent: number,       // Default: 5
  enableImageCache: boolean,       // Default: true
  maxCacheSize: number,            // Default: 50MB
  showQueueInfo: boolean,          // Default: true
  groupSimilarCommands: boolean    // Default: false
}
```

### 4. Image Caching

**Strategy:**
- Cache images in memory with LRU eviction
- Max size configurable via settings
- Cache key: `{image_key}_{width}_{height}_{scale}`
- Clear cache on extension restart

### 5. Error Handling

**Pattern:**
```typescript
try {
  await roonOperation();
  await showHUD("✓ Success message");
} catch (error) {
  await showToast({
    style: Toast.Style.Failure,
    title: "Operation Failed",
    message: error.message
  });
}
```

**Error Types:**
- Connection errors (Roon core not available)
- Zone errors (zone not found, zone not ready)
- Permission errors (operation not allowed in current state)
- API errors (invalid parameters, timeouts)

---

## Implementation Phases

### Phase 1: Setup & Modernization
**Branch:** `claude/complete-roon-extension-011CUKueHpdo2gd7PpyDSAK2`

#### Tasks:
1. Create feature branch
2. Update all dependencies to latest versions
3. Update TypeScript configuration for ES2022+
4. Add Node.js 22 requirement
5. Setup Vitest and testing infrastructure
6. Add node-roon-api-settings dependency
7. Run build to ensure no breaking changes
8. Commit: "chore: modernize dependencies and setup testing infrastructure"

#### Files Modified:
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- New: `vitest.config.ts`
- New: `src/__tests__/setup.ts`

---

### Phase 2: Core Infrastructure Improvements

#### Task 2.1: Zone Persistence Service
Create utility for managing last-used zones.

**New File:** `src/services/zonePersistence.ts`

```typescript
import { LocalStorage } from "@raycast/api";

export class ZonePersistenceService {
  private static readonly GLOBAL_KEY = "lastZone:global";

  static async getLastZone(commandName: string): Promise<string | undefined> {
    // Try command-specific last zone
    const commandKey = `lastZone:${commandName}`;
    const commandZone = await LocalStorage.getItem<string>(commandKey);
    if (commandZone) return commandZone;

    // Fallback to global last zone
    return await LocalStorage.getItem<string>(this.GLOBAL_KEY);
  }

  static async setLastZone(commandName: string, zoneId: string): Promise<void> {
    const commandKey = `lastZone:${commandName}`;
    await LocalStorage.setItem(commandKey, zoneId);
    await LocalStorage.setItem(this.GLOBAL_KEY, zoneId);
  }

  static async clearAll(): Promise<void> {
    const allKeys = await LocalStorage.allItems();
    for (const key of Object.keys(allKeys)) {
      if (key.startsWith("lastZone:")) {
        await LocalStorage.removeItem(key);
      }
    }
  }
}
```

**Tests:** `src/__tests__/zonePersistence.test.ts`

**Commit:** "feat: add zone persistence service for last-used zone tracking"

---

#### Task 2.2: Image Cache Service
Create in-memory image cache with LRU eviction.

**New File:** `src/services/imageCache.ts`

```typescript
interface CacheEntry {
  data: string; // base64
  size: number;
  timestamp: number;
}

export class ImageCacheService {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 50 * 1024 * 1024; // 50MB
  private currentSize: number = 0;

  getCacheKey(imageKey: string, opts?: ImageOpts): string {
    return `${imageKey}_${opts?.width || 0}_${opts?.height || 0}_${opts?.scale || ""}`;
  }

  get(key: string): string | undefined {
    return this.cache.get(key)?.data;
  }

  set(key: string, data: string): void {
    const size = data.length;

    // Evict if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.currentSize += size;
  }

  private evictOldest(): void {
    let oldest: [string, CacheEntry] | null = null;

    for (const entry of this.cache.entries()) {
      if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
        oldest = entry;
      }
    }

    if (oldest) {
      this.cache.delete(oldest[0]);
      this.currentSize -= oldest[1].size;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}

export const imageCache = new ImageCacheService();
```

**Tests:** `src/__tests__/imageCache.test.ts`

**Commit:** "feat: add LRU image cache service for performance optimization"

---

#### Task 2.3: Enhanced Roon Core Connection
Update connection handling with better error management.

**File:** `src/roon-core.ts`

**Updates:**
- Add connection retry logic (3 attempts with exponential backoff)
- Add connection state management
- Emit events for connection state changes
- Better error messages

**Commit:** "feat: enhance roon core connection with retry logic and state management"

---

#### Task 2.4: Settings Service Implementation

**New File:** `src/services/settings.ts`

```typescript
import { LocalStorage } from "@raycast/api";

export interface ExtensionSettings {
  seekStepSeconds: number;
  volumeStepPercent: number;
  enableImageCache: boolean;
  maxCacheSizeMB: number;
  showQueueInfo: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  seekStepSeconds: 10,
  volumeStepPercent: 5,
  enableImageCache: true,
  maxCacheSizeMB: 50,
  showQueueInfo: true,
};

export class SettingsService {
  private static readonly SETTINGS_KEY = "roon:settings";

  static async get(): Promise<ExtensionSettings> {
    const stored = await LocalStorage.getItem<string>(this.SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  }

  static async set(settings: Partial<ExtensionSettings>): Promise<void> {
    const current = await this.get();
    const updated = { ...current, ...settings };
    await LocalStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }
}
```

**New Command:** `src/settings.tsx` (view mode)

**Commit:** "feat: add settings service and settings command"

---

### Phase 3: Transport Commands - Complete Implementation

#### Task 3.1: Basic Transport No-View Commands

**New Files:**
- `src/commands/next-track.tsx`
- `src/commands/previous-track.tsx`
- `src/commands/stop.tsx`
- `src/commands/pause-all.tsx`
- `src/commands/toggle-loop.tsx`
- `src/commands/toggle-radio.tsx`

**Pattern for each command:**
```typescript
import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "../roon-core";
import { control } from "../roon/zone";
import { ZonePersistenceService } from "../services/zonePersistence";

export default async function Command() {
  try {
    const { zones } = await connect();

    if (zones.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Zones Available",
        message: "No Roon zones found"
      });
      return;
    }

    // Get last-used zone for this command
    const lastZoneId = await ZonePersistenceService.getLastZone("next-track");
    let zone = zones.find(z => z.zone_id === lastZoneId) || zones[0];

    await control(zone, "next");
    await ZonePersistenceService.setLastZone("next-track", zone.zone_id);
    await showHUD(`⏭️ Next track on ${zone.display_name}`);

  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Skip Track",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
```

**Update package.json** with new commands in the `commands` array.

**Commit:** "feat: add basic transport commands (next, previous, stop, pause-all, toggle-loop, toggle-radio)"

---

#### Task 3.2: Seek Commands

**New Files:**
- `src/commands/seek-forward.tsx`
- `src/commands/seek-backward.tsx`

**Implementation:**
```typescript
import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "../roon-core";
import { getCore } from "../roon/core";
import { ZonePersistenceService } from "../services/zonePersistence";
import { SettingsService } from "../services/settings";

export default async function SeekForward() {
  try {
    const { zones } = await connect();
    const settings = await SettingsService.get();
    const core = getCore(true);
    const transport = core.services.RoonApiTransport;

    if (zones.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Zones Available"
      });
      return;
    }

    const lastZoneId = await ZonePersistenceService.getLastZone("seek-forward");
    let zone = zones.find(z => z.zone_id === lastZoneId) || zones[0];

    if (!zone.is_seek_allowed) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Seek Not Available",
        message: "Current track does not support seeking"
      });
      return;
    }

    transport.seek(zone, "relative", settings.seekStepSeconds, (error) => {
      if (error) throw error;
    });

    await ZonePersistenceService.setLastZone("seek-forward", zone.zone_id);
    await showHUD(`⏩ +${settings.seekStepSeconds}s on ${zone.display_name}`);

  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Seek Failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
```

**Commit:** "feat: add seek forward/backward commands with configurable step size"

---

#### Task 3.3: Mute Commands

**New Files:**
- `src/commands/mute-all.tsx`
- `src/commands/unmute-all.tsx`

**Implementation:**
```typescript
import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "../roon-core";
import { getCore } from "../roon/core";

export default async function MuteAll() {
  try {
    await connect();
    const core = getCore(true);
    const transport = core.services.RoonApiTransport;

    transport.mute_all("mute", (error) => {
      if (error) throw error;
    });

    await showHUD("🔇 All zones muted");

  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Mute Failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
```

**Commit:** "feat: add mute-all and unmute-all commands"

---

#### Task 3.4: Enhanced Zones View

**File:** `src/zones.tsx`

**New Features to Add:**
1. Zone grouping/ungrouping actions
2. Queue transfer action
3. Seek slider (if is_seek_allowed)
4. Standby toggle for outputs
5. Loop mode display and cycling
6. Queue items/time remaining display
7. Better volume control (with step from settings)

**New Actions:**
```typescript
// Group zones action
<Action
  title="Group with Another Zone"
  icon={Icon.Link}
  onAction={async () => {
    // Show list of other zones to group with
    // Call transport.group_outputs([output1, output2])
  }}
/>

// Ungroup action
<Action
  title="Ungroup Zone"
  icon={Icon.Unlink}
  onAction={async () => {
    // Call transport.ungroup_outputs([output])
  }}
/>

// Transfer queue action
<Action
  title="Transfer Queue to Another Zone"
  icon={Icon.Forward}
  onAction={async () => {
    // Show list of target zones
    // Call transport.transfer_zone(fromZone, toZone)
  }}
/>

// Standby toggle (for each output)
<Action
  title="Toggle Standby"
  icon={Icon.Power}
  onAction={async () => {
    // Call transport.toggle_standby(output)
  }}
/>
```

**Update UI to show:**
- Loop mode indicator: 🔁 (loop), 🔂 (loop_one), ➡️ (disabled)
- Queue info: "12 tracks remaining • 47:23"
- Seek position slider (if allowed)

**Commit:** "feat: enhance zones view with grouping, queue transfer, and advanced controls"

---

### Phase 4: Browse Implementation

#### Task 4.1: Core Browse Service

**New File:** `src/services/browseService.ts`

```typescript
import { getCore } from "../roon/core";

export interface BrowseState {
  hierarchy: string;
  zoneId?: string;
  currentLevel: number;
  levels: BrowseLevel[];
}

export interface BrowseLevel {
  title: string;
  subtitle?: string;
  items: BrowseItem[];
  offset: number;
}

export interface BrowseItem {
  item_key: string;
  title: string;
  subtitle?: string;
  image_key?: string;
  hint?: string;
}

export class BrowseService {
  private state: BrowseState = {
    hierarchy: "browse",
    currentLevel: 0,
    levels: []
  };

  async browse(opts: {
    zoneId?: string;
    itemKey?: string;
    popAll?: boolean;
    popLevels?: number;
  }): Promise<BrowseLevel> {
    const core = getCore(true);
    const browse = core.services.RoonApiBrowse;

    return new Promise((resolve, reject) => {
      browse.browse({
        hierarchy: "browse",
        zone_or_output_id: opts.zoneId,
        item_key: opts.itemKey,
        pop_all: opts.popAll,
        pop_levels: opts.popLevels
      }, (error, body) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          title: body.title,
          subtitle: body.subtitle,
          items: body.list.items || [],
          offset: body.list.list_offset
        });
      });
    });
  }

  async load(level: number, offset: number, count: number = 100): Promise<BrowseItem[]> {
    const core = getCore(true);
    const browse = core.services.RoonApiBrowse;

    return new Promise((resolve, reject) => {
      browse.load({
        hierarchy: "browse",
        level,
        offset,
        count
      }, (error, body) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(body.list.items || []);
      });
    });
  }
}
```

**Commit:** "feat: add browse service with hierarchy navigation"

---

#### Task 4.2: Enhanced Browse View

**File:** `src/browse.tsx`

**Features:**
1. Breadcrumb navigation showing hierarchy path
2. Back button to go up levels
3. Infinite scroll pagination (load more as user scrolls)
4. Item actions (Play Now, Play Next, Add to Queue, etc.)
5. Album art for items with image_key
6. Search/filter within current level
7. Loading states and error handling

**Implementation Structure:**
```typescript
export default function Browse() {
  const [levels, setLevels] = useState<BrowseLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Load initial browse level
  useEffect(() => {
    loadLevel({ popAll: true });
  }, []);

  async function loadLevel(opts) {
    // Load browse level and update state
  }

  async function navigateToItem(item) {
    // Navigate down hierarchy
    loadLevel({ itemKey: item.item_key });
  }

  async function goBack() {
    // Navigate up one level
    loadLevel({ popLevels: 1 });
  }

  const currentItems = levels[currentLevel]?.items || [];
  const filteredItems = currentItems.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Filter items..."
      onSearchTextChange={setSearchText}
    >
      {currentLevel > 0 && (
        <List.Item
          title="← Back"
          icon={Icon.ArrowLeft}
          actions={
            <ActionPanel>
              <Action title="Go Back" onAction={goBack} />
            </ActionPanel>
          }
        />
      )}

      {filteredItems.map(item => (
        <List.Item
          key={item.item_key}
          title={item.title}
          subtitle={item.subtitle}
          icon={item.image_key ? { source: getImage(item.image_key) } : Icon.Music}
          actions={
            <ActionPanel>
              <Action
                title="Open"
                icon={Icon.ArrowRight}
                onAction={() => navigateToItem(item)}
              />
              <Action
                title="Play Now"
                icon={Icon.Play}
                onAction={() => playItem(item)}
              />
              <Action
                title="Add to Queue"
                icon={Icon.Plus}
                onAction={() => addToQueue(item)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

**Commit:** "feat: implement advanced browse view with navigation and actions"

---

#### Task 4.3: Search Command

**New File:** `src/commands/search.tsx`

Quick search interface that navigates browse hierarchy to search results.

**Implementation:**
```typescript
export default function Search() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchText.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  async function performSearch(query: string) {
    setLoading(true);
    try {
      // Navigate to search in browse hierarchy
      // This requires finding the search item_key in the browse hierarchy
      // Implementation depends on Roon's browse structure
    } finally {
      setLoading(false);
    }
  }

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search library..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {results.map(item => (
        <List.Item
          key={item.item_key}
          title={item.title}
          subtitle={item.subtitle}
          icon={item.image_key ? getImage(item.image_key) : Icon.Music}
          actions={
            <ActionPanel>
              <Action title="Play" onAction={() => playItem(item)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

**Commit:** "feat: add search command for quick library search"

---

### Phase 5: Polish & Optimization

#### Task 5.1: Update All Existing Commands

**Files to Update:**
- `src/toggle-play.tsx`
- `src/play.tsx`
- `src/pause.tsx`
- `src/toggle-shuffle.tsx`

**Changes:**
1. Add zone persistence (last-used zone)
2. Improve error handling
3. Use settings where applicable
4. Add proper TypeScript types
5. Remove hardcoded zone indices

**Commit:** "refactor: update existing commands with zone persistence and error handling"

---

#### Task 5.2: Update TypeScript Definitions

**Review and update all files in `src/definitions/`:**
- Ensure complete type coverage
- Add missing types discovered during implementation
- Add JSDoc comments for better IDE support

**Commit:** "chore: update TypeScript definitions with complete type coverage"

---

#### Task 5.3: Add Loading States and Placeholders

**Updates to view commands:**
- Add skeleton loaders for zones view
- Add empty state messages ("No zones found", "Library is empty")
- Add proper loading indicators
- Add retry buttons on errors

**Commit:** "feat: add loading states and empty state messages to all views"

---

#### Task 5.4: Image Optimization

**File:** `src/roon-core.ts` (update `image()` function)

**Changes:**
1. Integrate imageCache service
2. Add proper error handling for missing images
3. Add placeholder image for failed loads
4. Optimize image dimensions based on Raycast requirements

**Commit:** "feat: optimize image loading with caching and error handling"

---

### Phase 6: Testing

#### Task 6.1: Setup Test Infrastructure

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

**File:** `src/__tests__/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

**Commit:** "test: setup vitest infrastructure and test utilities"

---

#### Task 6.2: Write Unit Tests

**Test Files to Create:**

1. **`src/__tests__/zonePersistence.test.ts`**
   - Test getLastZone with and without stored values
   - Test setLastZone storage
   - Test fallback to global
   - Test clearAll

2. **`src/__tests__/imageCache.test.ts`**
   - Test cache get/set
   - Test LRU eviction
   - Test cache size limits
   - Test clear

3. **`src/__tests__/settings.test.ts`**
   - Test default settings
   - Test get/set operations
   - Test partial updates

4. **`src/__tests__/zone.test.ts`**
   - Test control function with different commands
   - Test changeSettings
   - Test volume controls
   - Test error handling

**Minimum Coverage Target:** 60% for utility functions

**Commit:** "test: add unit tests for core services and utilities"

---

#### Task 6.3: Manual Testing Checklist

Create a manual testing document.

**File:** `specs/TESTING_CHECKLIST.md`

```markdown
# Manual Testing Checklist

## Setup
- [ ] Extension builds without errors
- [ ] Extension loads in Raycast
- [ ] Roon core connection successful
- [ ] At least one zone available

## Transport Commands
- [ ] toggle-play works on last-used zone
- [ ] play command works
- [ ] pause command works
- [ ] next-track works
- [ ] previous-track works
- [ ] stop works
- [ ] toggle-shuffle works
- [ ] toggle-loop cycles through modes
- [ ] toggle-radio works
- [ ] pause-all pauses all zones
- [ ] mute-all mutes all zones
- [ ] unmute-all unmutes all zones
- [ ] seek-forward seeks correctly
- [ ] seek-backward seeks correctly

## Zones View
- [ ] Displays all available zones
- [ ] Shows now playing info
- [ ] Shows album art
- [ ] Play/pause actions work
- [ ] Next/previous actions work
- [ ] Volume increase/decrease works
- [ ] Mute/unmute works
- [ ] Shuffle toggle works
- [ ] Loop toggle works
- [ ] Zone grouping works
- [ ] Zone ungrouping works
- [ ] Queue transfer works
- [ ] Standby toggle works
- [ ] Search/filter works

## Browse View
- [ ] Loads initial browse level
- [ ] Navigation down hierarchy works
- [ ] Back button works
- [ ] Breadcrumb shows current path
- [ ] Items display correctly
- [ ] Album art loads
- [ ] Play action works
- [ ] Add to queue works
- [ ] Search/filter within level works

## Settings
- [ ] Settings view opens
- [ ] All settings display correctly
- [ ] Settings persist after change
- [ ] Seek step affects seek commands
- [ ] Volume step affects volume commands

## Zone Persistence
- [ ] Commands use last-used zone
- [ ] Different commands track separate zones
- [ ] Fallback to first zone works

## Error Handling
- [ ] No zones: shows appropriate message
- [ ] Roon disconnected: shows error toast
- [ ] Invalid operation: shows error toast
- [ ] Network timeout: shows error toast

## Performance
- [ ] Image caching works
- [ ] No lag in zones view
- [ ] Browse navigation is smooth
```

**Commit:** "docs: add manual testing checklist"

---

### Phase 7: Documentation

#### Task 7.1: Update README

**File:** `README.md`

**Sections to Add:**
1. Feature list (complete)
2. Installation instructions
3. Configuration guide
4. Command reference with keyboard shortcuts
5. Screenshots
6. Development setup
7. Testing instructions
8. Contributing guidelines
9. Troubleshooting

**Commit:** "docs: update README with comprehensive documentation"

---

#### Task 7.2: Create CHANGELOG

**File:** `CHANGELOG.md`

Document all changes in this implementation.

**Format:**
```markdown
# Changelog

## [2.0.0] - 2025-10-21

### Added
- Complete transport control suite (next, previous, stop, seek, mute-all, etc.)
- Advanced browse view with hierarchy navigation
- Search command for quick library access
- Settings command for user preferences
- Zone persistence (remembers last-used zone per command)
- Image caching for performance
- Comprehensive error handling
- Zone grouping and ungrouping
- Queue transfer between zones
- Standby control for outputs
- Test suite with Vitest

### Changed
- Updated to React 19 and Node 22
- Modernized dependencies to latest versions
- Enhanced zones view with advanced controls
- Improved error messages and user feedback

### Fixed
- Hardcoded zone indices removed
- Connection retry logic improved
- Memory leaks in event subscriptions
```

**Commit:** "docs: create comprehensive changelog"

---

#### Task 7.3: Add Code Comments and JSDoc

**Files to Document:**
- All public functions in services
- Complex algorithms (cache eviction, zone selection)
- React components props
- Non-obvious business logic

**Commit:** "docs: add JSDoc comments and inline documentation"

---

#### Task 7.4: Create Architecture Document

**File:** `specs/ARCHITECTURE.md`

**Sections:**
1. System Overview
2. Directory Structure
3. Data Flow Diagrams
4. Service Interactions
5. State Management
6. Event Handling
7. Error Handling Strategy
8. Performance Considerations

**Commit:** "docs: add architecture documentation"

---

### Phase 8: Final Polish

#### Task 8.1: Update package.json Metadata

**Updates:**
- Add proper description
- Add keywords
- Update author info
- Add repository URL
- Update commands with descriptions
- Add proper icons for commands (if different from default)

**Commit:** "chore: update package metadata and command descriptions"

---

#### Task 8.2: Lint and Format

```bash
npm run lint
npm run fix-lint
```

**Commit:** "chore: lint and format all code"

---

#### Task 8.3: Final Build Test

```bash
npm run build
```

Ensure clean build with no errors or warnings.

**Commit:** "chore: final build verification"

---

#### Task 8.4: Run All Tests

```bash
npm test
```

Ensure all tests pass.

**Commit:** "test: verify all tests passing"

---

## Commit Strategy

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```
feat(transport): add seek forward/backward commands

Implements seek commands with configurable step size from settings.
Users can now skip forward or backward by N seconds.

Closes #123

---

test(services): add unit tests for zone persistence

Adds comprehensive test coverage for ZonePersistenceService
including fallback logic and storage operations.

Coverage: 85%
```

### Commit Frequency

**Commit after:**
- Each task completion
- Each new file added
- Each significant refactor
- Before switching contexts
- After fixing a bug
- After running tests successfully

**Minimum:** 30-40 commits for complete implementation

---

## Acceptance Criteria

### Functional Requirements

✅ **Transport Controls**
- [ ] All basic controls work (play, pause, stop, next, previous)
- [ ] Seek commands work with configurable step
- [ ] Global mute/unmute works
- [ ] Loop and shuffle toggles work
- [ ] Pause all works

✅ **Zone Management**
- [ ] Zone list displays all available zones
- [ ] Real-time updates work
- [ ] Zone grouping/ungrouping works
- [ ] Queue transfer works
- [ ] Standby controls work
- [ ] Volume controls work
- [ ] Each zone shows now playing info

✅ **Browse**
- [ ] Hierarchy navigation works
- [ ] Back button works
- [ ] Items load correctly
- [ ] Pagination works
- [ ] Actions work (play, queue)
- [ ] Images display correctly

✅ **Settings**
- [ ] Settings view displays
- [ ] All settings can be modified
- [ ] Settings persist correctly
- [ ] Settings affect command behavior

✅ **Zone Persistence**
- [ ] Commands use last-used zone
- [ ] Per-command persistence works
- [ ] Fallback logic works

✅ **Error Handling**
- [ ] Connection errors show toast
- [ ] Zone errors show appropriate messages
- [ ] Network timeouts handled gracefully
- [ ] No unhandled promise rejections

### Technical Requirements

✅ **Code Quality**
- [ ] TypeScript strict mode enabled
- [ ] No TypeScript errors
- [ ] ESLint passes with no errors
- [ ] Code is properly formatted
- [ ] All functions have type signatures
- [ ] Public APIs have JSDoc comments

✅ **Testing**
- [ ] Unit tests for services pass
- [ ] Test coverage > 60% for utilities
- [ ] Manual testing checklist completed
- [ ] No console errors during testing

✅ **Performance**
- [ ] Image caching works
- [ ] No memory leaks
- [ ] UI is responsive (< 100ms interaction)
- [ ] Large lists render smoothly

✅ **Dependencies**
- [ ] All dependencies updated to latest
- [ ] No security vulnerabilities
- [ ] Package-lock.json committed
- [ ] Builds successfully

✅ **Documentation**
- [ ] README is comprehensive
- [ ] CHANGELOG is complete
- [ ] Architecture document exists
- [ ] Code comments are adequate
- [ ] Manual testing checklist exists

---

## Roon API Reference

### Services Used

1. **RoonApiTransport** - `core.services.RoonApiTransport`
   - `subscribe_zones(callback)`
   - `control(zone, command, callback)`
   - `seek(zone, how, seconds, callback)`
   - `change_volume(output, how, value, callback)`
   - `mute(output, how, callback)`
   - `mute_all(how, callback)`
   - `pause_all(callback)`
   - `group_outputs(outputs, callback)`
   - `ungroup_outputs(outputs, callback)`
   - `transfer_zone(from, to, callback)`
   - `change_settings(zone, settings, callback)`
   - `toggle_standby(output, opts, callback)`

2. **RoonApiBrowse** - `core.services.RoonApiBrowse`
   - `browse(opts, callback)`
   - `load(opts, callback)`

3. **RoonApiImage** - `core.services.RoonApiImage`
   - `get_image(image_key, opts, callback)`

4. **RoonApiStatus** - `svc_status`
   - `set_status(message, is_error)`

### Zone Object Structure

```typescript
interface Zone {
  zone_id: string;
  display_name: string;
  outputs: Output[];
  state: "playing" | "paused" | "loading" | "stopped";
  seek_position?: number;
  queue_items_remaining?: number;
  queue_time_remaining?: number;
  is_previous_allowed: boolean;
  is_next_allowed: boolean;
  is_pause_allowed: boolean;
  is_play_allowed: boolean;
  is_seek_allowed: boolean;
  settings: {
    loop: "loop" | "loop_one" | "disabled";
    shuffle: boolean;
    auto_radio: boolean;
  };
  now_playing?: {
    seek_position?: number;
    length?: number;
    image_key?: string;
    one_line: { line1: string };
    two_line: { line1: string; line2: string };
    three_line: { line1: string; line2: string; line3: string };
  };
}

interface Output {
  output_id: string;
  zone_id: string;
  display_name: string;
  state: "playing" | "paused" | "loading" | "stopped";
  source_controls?: SourceControl[];
  volume?: {
    type: "number" | "db" | "incremental";
    min?: number;
    max?: number;
    value: number;
    step?: number;
    is_muted: boolean;
  };
}
```

---

## Implementation Timeline Estimate

**Total Estimated Time:** 16-24 hours

- **Phase 1 (Setup):** 2-3 hours
- **Phase 2 (Infrastructure):** 4-5 hours
- **Phase 3 (Transport):** 3-4 hours
- **Phase 4 (Browse):** 4-5 hours
- **Phase 5 (Polish):** 2-3 hours
- **Phase 6 (Testing):** 2-3 hours
- **Phase 7 (Documentation):** 2-3 hours
- **Phase 8 (Final):** 1 hour

---

## Notes for Implementation

### Critical Considerations

1. **Async Callbacks:** Roon API uses callback-based async. Wrap in Promises for async/await.

2. **Zone Changes:** Always subscribe to zone updates and handle all event types (Subscribed, Changed, Unsubscribed).

3. **Image Keys:** Never assume image_key exists. Always check before calling get_image.

4. **Zone Permissions:** Always check `is_*_allowed` before executing commands.

5. **Error Messages:** Provide helpful, user-friendly error messages, not technical stack traces.

6. **Memory Management:** Unsubscribe from events on component unmount to prevent memory leaks.

7. **LocalStorage:** Raycast's LocalStorage is async. Always await operations.

8. **HUD vs Toast:** Use HUD for successful quick actions (no-view commands), Toast for errors and view commands.

### Raycast Best Practices

1. **Icons:** Use built-in Raycast icons when possible
2. **Actions:** Primary action should be first, destructive actions last
3. **Search:** Implement search with throttle for performance
4. **Loading:** Show loading states for operations > 100ms
5. **Empty States:** Always provide helpful empty state messages
6. **Keyboard Shortcuts:** Assign shortcuts to common actions
7. **Detail View:** Use detail view for rich information display
8. **Accessories:** Use accessories for status indicators in lists

### Testing Notes

Since Roon API requires actual Roon Core connection:
- Unit tests should mock the Roon API responses
- Integration tests require manual testing with real Roon instance
- Focus unit tests on business logic, not API integration
- Use dependency injection pattern for easier mocking

---

## Success Metrics

- [ ] All 20+ commands implemented and working
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Clean build with no warnings
- [ ] All unit tests passing
- [ ] Manual testing checklist 100% complete
- [ ] Documentation complete and accurate
- [ ] Code reviewed and refactored for clarity
- [ ] Ready for Raycast store submission

---

**END OF SPECIFICATION**

*This document should provide complete guidance for implementing all features. Each phase builds on the previous, and commits should be made frequently. Good luck!*
