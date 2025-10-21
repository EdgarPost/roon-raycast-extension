import { LocalStorage } from "@raycast/api";

/**
 * Extension settings configuration
 */
export interface ExtensionSettings {
  /** Number of seconds to seek forward/backward (default: 10) */
  seekStepSeconds: number;
  /** Volume adjustment step in percent (default: 5) */
  volumeStepPercent: number;
  /** Enable image caching (default: true) */
  enableImageCache: boolean;
  /** Maximum cache size in megabytes (default: 50) */
  maxCacheSizeMB: number;
  /** Show queue information in zone details (default: true) */
  showQueueInfo: boolean;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  seekStepSeconds: 10,
  volumeStepPercent: 5,
  enableImageCache: true,
  maxCacheSizeMB: 50,
  showQueueInfo: true,
};

/**
 * Service for managing extension settings.
 * Settings are persisted in LocalStorage.
 */
export class SettingsService {
  private static readonly SETTINGS_KEY = "roon:settings";

  /**
   * Get current settings.
   * Returns default settings merged with any stored user preferences.
   *
   * @returns The current settings
   */
  static async get(): Promise<ExtensionSettings> {
    const stored = await LocalStorage.getItem<string>(this.SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        // If parsing fails, return defaults
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Update settings with partial values.
   * Merges provided settings with existing settings.
   *
   * @param settings - Partial settings to update
   */
  static async set(settings: Partial<ExtensionSettings>): Promise<void> {
    const current = await this.get();
    const updated = { ...current, ...settings };
    await LocalStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  /**
   * Reset all settings to defaults.
   */
  static async reset(): Promise<void> {
    await LocalStorage.removeItem(this.SETTINGS_KEY);
  }
}
