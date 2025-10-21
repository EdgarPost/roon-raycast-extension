/**
 * Options for image retrieval from Roon API
 */
export interface ImageOpts {
  width?: number;
  height?: number;
  scale?: string;
}

/**
 * Cache entry for storing image data with metadata
 */
interface CacheEntry {
  data: string; // base64-encoded image data
  size: number; // size in bytes
  timestamp: number; // timestamp when cached
}

/**
 * In-memory image cache with LRU (Least Recently Used) eviction.
 * Caches images by key to improve performance and reduce API calls.
 */
export class ImageCacheService {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 50 * 1024 * 1024; // 50MB default max size
  private currentSize: number = 0;

  /**
   * Generate a unique cache key based on image key and options.
   *
   * @param imageKey - The Roon image key
   * @param opts - Optional image options (width, height, scale)
   * @returns A unique cache key string
   */
  getCacheKey(imageKey: string, opts?: ImageOpts): string {
    return `${imageKey}_${opts?.width || 0}_${opts?.height || 0}_${opts?.scale || ""}`;
  }

  /**
   * Retrieve cached image data.
   *
   * @param key - The cache key
   * @returns The cached image data or undefined if not found
   */
  get(key: string): string | undefined {
    return this.cache.get(key)?.data;
  }

  /**
   * Store image data in cache.
   * Automatically evicts oldest entries if cache size limit is exceeded.
   *
   * @param key - The cache key
   * @param data - The base64-encoded image data
   */
  set(key: string, data: string): void {
    const size = data.length;

    // Evict entries until we have enough space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.currentSize += size;
  }

  /**
   * Set the maximum cache size in bytes.
   *
   * @param sizeMB - Maximum cache size in megabytes
   */
  setMaxSize(sizeMB: number): void {
    this.maxSize = sizeMB * 1024 * 1024;

    // Evict entries if current size exceeds new max size
    while (this.currentSize > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }
  }

  /**
   * Evict the oldest entry from the cache (LRU eviction).
   * @private
   */
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

  /**
   * Clear all cached images.
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get current cache statistics.
   *
   * @returns Object containing cache size info
   */
  getStats(): { entries: number; sizeBytes: number; sizeMB: number; maxSizeMB: number } {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSize,
      sizeMB: this.currentSize / (1024 * 1024),
      maxSizeMB: this.maxSize / (1024 * 1024),
    };
  }
}

/**
 * Global image cache instance
 */
export const imageCache = new ImageCacheService();
