import { LocalStorage } from "@raycast/api";

/**
 * Service for managing zone persistence across commands.
 * Tracks the last-used zone per command and provides a global fallback.
 */
export class ZonePersistenceService {
  private static readonly GLOBAL_KEY = "lastZone:global";

  /**
   * Get the last-used zone for a specific command.
   * Falls back to the global last-used zone if no command-specific zone exists.
   *
   * @param commandName - The name of the command (e.g., "toggle-play", "next-track")
   * @returns The zone ID or undefined if no zone has been used
   */
  static async getLastZone(commandName: string): Promise<string | undefined> {
    // Try command-specific last zone
    const commandKey = `lastZone:${commandName}`;
    const commandZone = await LocalStorage.getItem<string>(commandKey);
    if (commandZone) return commandZone;

    // Fallback to global last zone
    return await LocalStorage.getItem<string>(this.GLOBAL_KEY);
  }

  /**
   * Set the last-used zone for a specific command.
   * Also updates the global last-used zone.
   *
   * @param commandName - The name of the command (e.g., "toggle-play", "next-track")
   * @param zoneId - The zone ID to store
   */
  static async setLastZone(commandName: string, zoneId: string): Promise<void> {
    const commandKey = `lastZone:${commandName}`;
    await LocalStorage.setItem(commandKey, zoneId);
    await LocalStorage.setItem(this.GLOBAL_KEY, zoneId);
  }

  /**
   * Clear all stored zone preferences.
   * Useful for testing or resetting the extension state.
   */
  static async clearAll(): Promise<void> {
    const allKeys = await LocalStorage.allItems();
    for (const key of Object.keys(allKeys)) {
      if (key.startsWith("lastZone:")) {
        await LocalStorage.removeItem(key);
      }
    }
  }
}
