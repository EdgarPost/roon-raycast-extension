import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsService, DEFAULT_SETTINGS } from "../services/settings";

// Mock @raycast/api
vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { LocalStorage } from "@raycast/api";

describe("SettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("should return default settings when nothing is stored", async () => {
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce(undefined);

      const settings = await SettingsService.get();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should merge stored settings with defaults", async () => {
      const storedSettings = {
        seekStepSeconds: 15,
      };
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce(JSON.stringify(storedSettings));

      const settings = await SettingsService.get();

      expect(settings.seekStepSeconds).toBe(15);
      expect(settings.volumeStepPercent).toBe(DEFAULT_SETTINGS.volumeStepPercent);
      expect(settings.enableImageCache).toBe(DEFAULT_SETTINGS.enableImageCache);
    });

    it("should handle corrupted JSON gracefully", async () => {
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce("invalid-json{");

      const settings = await SettingsService.get();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("set", () => {
    it("should merge partial settings with existing settings", async () => {
      const existingSettings = {
        seekStepSeconds: 10,
        volumeStepPercent: 5,
        enableImageCache: true,
        maxCacheSizeMB: 50,
        showQueueInfo: true,
      };
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce(JSON.stringify(existingSettings));

      await SettingsService.set({ seekStepSeconds: 20 });

      expect(LocalStorage.setItem).toHaveBeenCalledWith(
        "roon:settings",
        JSON.stringify({
          ...existingSettings,
          seekStepSeconds: 20,
        }),
      );
    });

    it("should create new settings if none exist", async () => {
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce(undefined);

      await SettingsService.set({ seekStepSeconds: 15 });

      expect(LocalStorage.setItem).toHaveBeenCalledWith(
        "roon:settings",
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          seekStepSeconds: 15,
        }),
      );
    });
  });

  describe("reset", () => {
    it("should remove settings from storage", async () => {
      await SettingsService.reset();

      expect(LocalStorage.removeItem).toHaveBeenCalledWith("roon:settings");
    });
  });

  describe("DEFAULT_SETTINGS", () => {
    it("should have expected default values", () => {
      expect(DEFAULT_SETTINGS).toEqual({
        seekStepSeconds: 10,
        volumeStepPercent: 5,
        enableImageCache: true,
        maxCacheSizeMB: 50,
        showQueueInfo: true,
      });
    });
  });
});
