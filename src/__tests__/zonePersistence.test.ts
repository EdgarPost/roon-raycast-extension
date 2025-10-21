import { describe, it, expect, beforeEach, vi } from "vitest";
import { ZonePersistenceService } from "../services/zonePersistence";

// Mock @raycast/api
vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    allItems: vi.fn(),
  },
}));

import { LocalStorage } from "@raycast/api";

describe("ZonePersistenceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLastZone", () => {
    it("should return command-specific zone if it exists", async () => {
      vi.mocked(LocalStorage.getItem).mockResolvedValueOnce("zone-123");

      const result = await ZonePersistenceService.getLastZone("toggle-play");

      expect(result).toBe("zone-123");
      expect(LocalStorage.getItem).toHaveBeenCalledWith("lastZone:toggle-play");
    });

    it("should fallback to global zone if command-specific zone doesn't exist", async () => {
      vi.mocked(LocalStorage.getItem)
        .mockResolvedValueOnce(undefined) // command-specific
        .mockResolvedValueOnce("zone-global"); // global

      const result = await ZonePersistenceService.getLastZone("toggle-play");

      expect(result).toBe("zone-global");
      expect(LocalStorage.getItem).toHaveBeenCalledWith("lastZone:toggle-play");
      expect(LocalStorage.getItem).toHaveBeenCalledWith("lastZone:global");
    });

    it("should return undefined if no zones are stored", async () => {
      vi.mocked(LocalStorage.getItem).mockResolvedValue(undefined);

      const result = await ZonePersistenceService.getLastZone("toggle-play");

      expect(result).toBeUndefined();
    });
  });

  describe("setLastZone", () => {
    it("should set both command-specific and global zones", async () => {
      await ZonePersistenceService.setLastZone("toggle-play", "zone-456");

      expect(LocalStorage.setItem).toHaveBeenCalledWith("lastZone:toggle-play", "zone-456");
      expect(LocalStorage.setItem).toHaveBeenCalledWith("lastZone:global", "zone-456");
      expect(LocalStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearAll", () => {
    it("should remove all zone persistence keys", async () => {
      vi.mocked(LocalStorage.allItems).mockResolvedValueOnce({
        "lastZone:toggle-play": "zone-1",
        "lastZone:play": "zone-2",
        "lastZone:global": "zone-3",
        "other-key": "value",
      });

      await ZonePersistenceService.clearAll();

      expect(LocalStorage.removeItem).toHaveBeenCalledWith("lastZone:toggle-play");
      expect(LocalStorage.removeItem).toHaveBeenCalledWith("lastZone:play");
      expect(LocalStorage.removeItem).toHaveBeenCalledWith("lastZone:global");
      expect(LocalStorage.removeItem).not.toHaveBeenCalledWith("other-key");
      expect(LocalStorage.removeItem).toHaveBeenCalledTimes(3);
    });

    it("should handle empty storage", async () => {
      vi.mocked(LocalStorage.allItems).mockResolvedValueOnce({});

      await ZonePersistenceService.clearAll();

      expect(LocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
