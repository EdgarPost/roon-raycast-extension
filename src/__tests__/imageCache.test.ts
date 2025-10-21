import { describe, it, expect, beforeEach } from "vitest";
import { ImageCacheService } from "../services/imageCache";

describe("ImageCacheService", () => {
  let cache: ImageCacheService;

  beforeEach(() => {
    cache = new ImageCacheService();
  });

  describe("getCacheKey", () => {
    it("should generate unique keys for different images", () => {
      const key1 = cache.getCacheKey("image1");
      const key2 = cache.getCacheKey("image2");

      expect(key1).not.toBe(key2);
    });

    it("should generate unique keys for different options", () => {
      const key1 = cache.getCacheKey("image1", { width: 100, height: 100 });
      const key2 = cache.getCacheKey("image1", { width: 200, height: 200 });

      expect(key1).not.toBe(key2);
    });

    it("should generate consistent keys for same inputs", () => {
      const key1 = cache.getCacheKey("image1", { width: 100, height: 100, scale: "fit" });
      const key2 = cache.getCacheKey("image1", { width: 100, height: 100, scale: "fit" });

      expect(key1).toBe(key2);
    });
  });

  describe("get and set", () => {
    it("should store and retrieve cached data", () => {
      const key = "test-key";
      const data = "base64-encoded-image-data";

      cache.set(key, data);
      const result = cache.get(key);

      expect(result).toBe(data);
    });

    it("should return undefined for non-existent keys", () => {
      const result = cache.get("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("LRU eviction", () => {
    it("should evict oldest entry when cache is full", () => {
      const smallCache = new ImageCacheService();
      smallCache.setMaxSize(0.001); // Very small cache: 0.001 MB = 1KB

      // Add entries that exceed cache size
      const data1 = "x".repeat(500); // 500 bytes
      const data2 = "y".repeat(500); // 500 bytes
      const data3 = "z".repeat(500); // 500 bytes

      smallCache.set("key1", data1);
      smallCache.set("key2", data2);
      smallCache.set("key3", data3); // Should evict key1

      expect(smallCache.get("key1")).toBeUndefined();
      expect(smallCache.get("key2")).toBeDefined();
      expect(smallCache.get("key3")).toBeDefined();
    });
  });

  describe("setMaxSize", () => {
    it("should evict entries when reducing max size", () => {
      const data1 = "x".repeat(10000);
      const data2 = "y".repeat(10000);

      cache.set("key1", data1);
      cache.set("key2", data2);

      // Reduce max size to force eviction
      cache.setMaxSize(0.01); // 0.01 MB = 10KB

      const stats = cache.getStats();
      expect(stats.entries).toBeLessThan(2);
    });
  });

  describe("clear", () => {
    it("should remove all cached entries", () => {
      cache.set("key1", "data1");
      cache.set("key2", "data2");

      cache.clear();

      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
      expect(stats.sizeBytes).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should return correct cache statistics", () => {
      const data = "x".repeat(1000);
      cache.set("key1", data);

      const stats = cache.getStats();

      expect(stats.entries).toBe(1);
      expect(stats.sizeBytes).toBe(1000);
      expect(stats.sizeMB).toBeCloseTo(1000 / (1024 * 1024));
      expect(stats.maxSizeMB).toBe(50); // Default max size
    });
  });
});
