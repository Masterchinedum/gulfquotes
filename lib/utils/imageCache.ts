// lib/utils/imageCache.ts

interface CacheEntry {
  buffer: Buffer;
  url: string;
  timestamp: number;
  metadata: ImageMetadata;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  quality: number;
  size: number;
  optimized: boolean;
  deviceType?: string;
  pixelRatio?: number;
}

interface CacheOptions {
  maxEntries?: number;
  maxAge?: number;
  maxSize?: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry>;
  private sizeCache: Map<string, Map<string, CacheEntry>>;
  private backgroundCache: Map<string, CacheEntry>;
  
  private readonly MAX_CACHE_ENTRIES: number;
  private readonly MAX_CACHE_AGE: number;
  private readonly MAX_CACHE_SIZE: number;
  private currentCacheSize: number;

  constructor(options?: CacheOptions) {
    this.cache = new Map();
    this.sizeCache = new Map();
    this.backgroundCache = new Map();
    this.currentCacheSize = 0;

    // Initialize limits from options or use defaults
    this.MAX_CACHE_ENTRIES = options?.maxEntries ?? 100;
    this.MAX_CACHE_AGE = options?.maxAge ?? 1000 * 60 * 60; // 1 hour default
    this.MAX_CACHE_SIZE = options?.maxSize ?? 100 * 1024 * 1024; // 100MB default

    // Set up periodic cache cleanup
    setInterval(() => this.cleanup(), 1000 * 60 * 15); // Clean every 15 minutes
  }

  /**
   * Get cached image by key
   */
  get(key: string, size?: string): CacheEntry | undefined {
    if (size) {
      return this.getSizedEntry(key, size);
    }
    return this.getEntry(key);
  }

  /**
   * Store image in cache
   */
  set(
    key: string,
    buffer: Buffer,
    metadata: ImageMetadata,
    size?: string
  ): void {
    const entry: CacheEntry = {
      buffer,
      url: key,
      timestamp: Date.now(),
      metadata
    };

    if (size) {
      this.setSizedEntry(key, size, entry);
    } else {
      this.setEntry(key, entry);
    }

    this.enforceMaxSize();
  }

  /**
   * Cache background image
   */
  setBackground(
    url: string,
    buffer: Buffer,
    metadata: ImageMetadata
  ): void {
    const entry: CacheEntry = {
      buffer,
      url,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        optimized: true
      }
    };

    this.backgroundCache.set(url, entry);
    this.updateCacheSize(buffer.length);
    this.enforceMaxSize();
  }

  /**
   * Get cached background image
   */
  getBackground(url: string): CacheEntry | undefined {
    const entry = this.backgroundCache.get(url);
    if (entry && this.isValid(entry)) {
      return entry;
    }
    this.backgroundCache.delete(url);
    return undefined;
  }

  /**
   * Check if cache has key
   */
  has(key: string, size?: string): boolean {
    if (size) {
      const sizeCache = this.sizeCache.get(key);
      return sizeCache ? sizeCache.has(size) : false;
    }
    return this.cache.has(key);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string, size?: string): boolean {
    if (size) {
      const sizeCache = this.sizeCache.get(key);
      if (sizeCache) {
        const entry = sizeCache.get(size);
        if (entry) {
          this.updateCacheSize(-entry.buffer.length);
          return sizeCache.delete(size);
        }
      }
      return false;
    }

    const entry = this.cache.get(key);
    if (entry) {
      this.updateCacheSize(-entry.buffer.length);
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.cache.clear();
    this.sizeCache.clear();
    this.backgroundCache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    sizeEntries: number;
    backgroundEntries: number;
    totalSize: number;
  } {
    return {
      entries: this.cache.size,
      sizeEntries: Array.from(this.sizeCache.values()).reduce(
        (total, sizeCache) => total + sizeCache.size,
        0
      ),
      backgroundEntries: this.backgroundCache.size,
      totalSize: this.currentCacheSize
    };
  }

  private getEntry(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry && this.isValid(entry)) {
      return entry;
    }
    this.cache.delete(key);
    return undefined;
  }

  private getSizedEntry(key: string, size: string): CacheEntry | undefined {
    const sizeCache = this.sizeCache.get(key);
    if (!sizeCache) return undefined;

    const entry = sizeCache.get(size);
    if (entry && this.isValid(entry)) {
      return entry;
    }
    sizeCache.delete(size);
    return undefined;
  }

  private setEntry(key: string, entry: CacheEntry): void {
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.updateCacheSize(-oldEntry.buffer.length);
    }

    this.cache.set(key, entry);
    this.updateCacheSize(entry.buffer.length);
  }

  private setSizedEntry(key: string, size: string, entry: CacheEntry): void {
    let sizeCache = this.sizeCache.get(key);
    if (!sizeCache) {
      sizeCache = new Map();
      this.sizeCache.set(key, sizeCache);
    }

    const oldEntry = sizeCache.get(size);
    if (oldEntry) {
      this.updateCacheSize(-oldEntry.buffer.length);
    }

    sizeCache.set(size, entry);
    this.updateCacheSize(entry.buffer.length);
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.MAX_CACHE_AGE;
  }

  private updateCacheSize(delta: number): void {
    this.currentCacheSize += delta;
  }

  private enforceMaxSize(): void {
    // First check entries limit
    if (this.getTotalEntries() > this.MAX_CACHE_ENTRIES) {
      this.removeOldestEntries();
    }

    // Then check size limit
    if (this.currentCacheSize > this.MAX_CACHE_SIZE) {
      this.removeLargestEntries();
    }
  }

  private getTotalEntries(): number {
    return (
      this.cache.size +
      this.backgroundCache.size +
      Array.from(this.sizeCache.values()).reduce(
        (total, sizeCache) => total + sizeCache.size,
        0
      )
    );
  }

  private removeOldestEntries(): void {
    const allEntries = this.getAllEntriesSortedByTimestamp();
    const entriesToRemove = allEntries.slice(0, allEntries.length - this.MAX_CACHE_ENTRIES);
    
    for (const [key, entry] of entriesToRemove) {
      this.removeEntry(key, entry);
    }
  }

  private removeLargestEntries(): void {
    const allEntries = this.getAllEntriesSortedBySize();
    
    while (this.currentCacheSize > this.MAX_CACHE_SIZE && allEntries.length > 0) {
      const [key, entry] = allEntries.pop()!;
      this.removeEntry(key, entry);
    }
  }

  private getAllEntriesSortedByTimestamp(): [string, CacheEntry][] {
    return [
      ...Array.from(this.cache.entries()),
      ...Array.from(this.backgroundCache.entries()),
      ...Array.from(this.sizeCache.values()).flatMap(sizeCache => 
        Array.from(sizeCache.entries())
      )
    ].sort((a, b) => a[1].timestamp - b[1].timestamp);
  }

  private getAllEntriesSortedBySize(): [string, CacheEntry][] {
    return [
      ...Array.from(this.cache.entries()),
      ...Array.from(this.backgroundCache.entries()),
      ...Array.from(this.sizeCache.values()).flatMap(sizeCache => 
        Array.from(sizeCache.entries())
      )
    ].sort((a, b) => b[1].buffer.length - a[1].buffer.length);
  }

  private removeEntry(key: string, entry: CacheEntry): void {
    this.updateCacheSize(-entry.buffer.length);

    // Try to remove from main cache
    if (this.cache.delete(key)) return;

    // Try to remove from background cache
    if (this.backgroundCache.delete(key)) return;

    // Try to remove from size cache
    const [parentKey, size] = key.split('::');
    if (size) {
      const sizeCache = this.sizeCache.get(parentKey);
      if (sizeCache?.delete(size)) {
        if (sizeCache.size === 0) {
          this.sizeCache.delete(parentKey);
        }
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean main cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.delete(key);
      }
    }

    // Clean size cache
    for (const [key, sizeCache] of this.sizeCache.entries()) {
      for (const [size, entry] of sizeCache.entries()) {
        if (now - entry.timestamp > this.MAX_CACHE_AGE) {
          this.delete(key, size);
        }
      }
      if (sizeCache.size === 0) {
        this.sizeCache.delete(key);
      }
    }

    // Clean background cache
    for (const [key, entry] of this.backgroundCache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.backgroundCache.delete(key);
        this.updateCacheSize(-entry.buffer.length);
      }
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();