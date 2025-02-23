// lib/utils/imageProcessor.ts
import { quoteImageGenerator } from './imageGenerator';
import { imageScaler } from './imageScaler';
import { imageCache } from './imageCache';
import { AppError } from '@/lib/api-error';
import { EventEmitter } from 'events';
import sharp from 'sharp';

interface ProcessingTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  retries: number;
  error?: string;
  startTime?: number;
  endTime?: number;
  memoryUsage?: number;
  priority?: number;
}

interface ProcessingOptions {
  content: string;
  author: string;
  siteName: string;
  backgroundUrl?: string | null;
  maxRetries?: number;
  deviceWidth?: number;
  deviceHeight?: number;
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
  priority?: number;
  batchId?: string;
}

interface BatchProcessingResult {
  successful: Array<{ id: string; buffer: Buffer }>;
  failed: Array<{ id: string; error: Error }>;
}

class ImageProcessor extends EventEmitter {
  private queue: Map<string, ProcessingTask>;
  private batchQueues: Map<string, Set<string>>;
  private processing: boolean;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly MAX_CONCURRENT = 3;
  private readonly MAX_MEMORY_USAGE = 1024 * 1024 * 512; // 512MB
  private activeProcessing: number;
  private currentMemoryUsage: number;
  private cleanupInterval: NodeJS.Timer;

  constructor() {
    super();
    this.queue = new Map();
    this.batchQueues = new Map();
    this.processing = false;
    this.activeProcessing = 0;
    this.currentMemoryUsage = 0;

    // Initialize cleanup routine
    this.cleanupInterval = setInterval(() => this.runCleanup(), 1000 * 60 * 5); // Every 5 minutes
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  /**
   * Process multiple images in parallel
   */
  async processBatch(tasks: ProcessingOptions[]): Promise<BatchProcessingResult> {
    const batchId = `batch_${Date.now()}`;
    const batchSet = new Set<string>();
    this.batchQueues.set(batchId, batchSet);

    const results: BatchProcessingResult = {
      successful: [],
      failed: []
    };

    try {
      // Process tasks in parallel with concurrency limit
      const taskGroups = this.chunkArray(tasks, this.MAX_CONCURRENT);
      
      for (const group of taskGroups) {
        const promises = group.map(async (task) => {
          try {
            const buffer = await this.processImage({
              ...task,
              batchId,
              priority: task.priority || 1
            });
            return { id: task.content, buffer };
          } catch (error) {
            return { id: task.content, error: error as Error };
          }
        });

        const groupResults = await Promise.all(promises);
        
        groupResults.forEach(result => {
          if ('buffer' in result) {
            results.successful.push(result);
          } else {
            results.failed.push(result);
          }
        });

        // Check memory usage after each group
        await this.checkMemoryUsage();
      }
    } finally {
      // Cleanup batch queue
      this.batchQueues.delete(batchId);
    }

    return results;
  }

  /**
   * Add new image processing task to queue with priority
   */
  async processImage(options: ProcessingOptions): Promise<Buffer> {
    const taskId = this.generateTaskId();
    const task: ProcessingTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      retries: 0,
      priority: options.priority || 1
    };

    this.queue.set(taskId, task);
    if (options.batchId) {
      this.batchQueues.get(options.batchId)?.add(taskId);
    }

    // Check memory before processing
    await this.checkMemoryUsage();
    
    this.startProcessing();

    return new Promise((resolve, reject) => {
      this.processTask(taskId, options)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.cleanupTask(taskId);
        });
    });
  }

  /**
   * Process individual task with retry logic
   */
  private async processTask(
    taskId: string,
    options: ProcessingOptions
  ): Promise<Buffer> {
    const task = this.queue.get(taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'processing';
    task.startTime = Date.now();

    try {
      // Step 1: Initial render at 1080x1080
      this.updateProgress(taskId, 20);
      const initialBuffer = await this.renderInitialImage(options);

      // Step 2: Convert to static image
      this.updateProgress(taskId, 50);
      const staticImage = await this.convertToStaticImage(initialBuffer);

      // Step 3: Scale for device if dimensions provided
      this.updateProgress(taskId, 80);
      const finalBuffer = await this.scaleForDevice(
        staticImage,
        options.deviceWidth,
        options.deviceHeight,
        {
          quality: options.quality,
          format: options.format,
          preserveText: true
        }
      );

      task.status = 'completed';
      task.progress = 100;
      task.endTime = Date.now();

      return finalBuffer;

    } catch (error) {
      return await this.handleError(taskId, error, options);
    }
  }

  /**
   * Handle errors with retry logic
   */
  private async handleError(
    taskId: string,
    error: unknown,
    options: ProcessingOptions
  ): Promise<Buffer> {
    const task = this.queue.get(taskId);
    if (!task) throw new Error('Task not found');

    const maxRetries = options.maxRetries ?? this.MAX_RETRIES;

    if (task.retries < maxRetries) {
      task.retries++;
      task.status = 'pending';
      task.error = error instanceof Error ? error.message : 'Unknown error';

      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, task.retries - 1))
      );

      return this.processTask(taskId, options);
    }

    task.status = 'failed';
    task.endTime = Date.now();

    if (error instanceof AppError) throw error;
    throw new AppError(
      'Failed to process image after multiple retries',
      'IMAGE_PROCESSING_FAILED',
      500
    );
  }

  /**
   * Initial image rendering
   */
  private async renderInitialImage(options: ProcessingOptions): Promise<Buffer> {
    return await quoteImageGenerator.generate({
      content: options.content,
      author: options.author,
      siteName: options.siteName,
      backgroundUrl: options.backgroundUrl
    });
  }

  /**
   * Convert to static image with optimized settings
   */
  private async convertToStaticImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        // Maintain original dimensions
        .rotate() // Auto-rotate based on EXIF
        .withMetadata() // Preserve metadata
        // Apply optimizations
        .png({
          compressionLevel: 9,
          palette: true, // Use indexed color when possible
          quality: 100,
          effort: 10, // Max compression effort
          colors: 256, // Max colors for indexed mode
          dither: 1.0 // Full dithering for better quality
        })
        .toBuffer();
    } catch (error) {
      throw new AppError(
        'Failed to convert to static image',
        'IMAGE_CONVERSION_FAILED', 
        500
      );
    }
  }

  /**
   * Scale for specific device
   */
  private async scaleForDevice(
    buffer: Buffer,
    deviceWidth?: number,
    deviceHeight?: number,
    options?: {
      quality?: number;
      format?: 'webp' | 'png' | 'jpeg';
      preserveText?: boolean;
    }
  ): Promise<Buffer> {
    if (!deviceWidth || !deviceHeight) return buffer;

    return await imageScaler.scaleForDevice(
      buffer,
      deviceWidth,
      deviceHeight,
      options
    );
  }

  /**
   * Update task progress
   */
  private updateProgress(taskId: string, progress: number): void {
    const task = this.queue.get(taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    if (this.processing || this.activeProcessing >= this.MAX_CONCURRENT) return;
    this.processing = true;

    setTimeout(() => {
      this.processing = false;
      if (this.queue.size > 0) {
        this.startProcessing();
      }
    }, 0);
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): ProcessingTask | null {
    return this.queue.get(taskId) || null;
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks(): void {
    for (const [id, task] of this.queue.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.queue.delete(id);
      }
    }
  }

  /**
   * Memory management methods
   */
  private async checkMemoryUsage(): Promise<void> {
    if (this.currentMemoryUsage > this.MAX_MEMORY_USAGE) {
      // Wait for memory to be freed
      await new Promise(resolve => {
        const check = () => {
          if (this.currentMemoryUsage <= this.MAX_MEMORY_USAGE * 0.8) {
            resolve(undefined);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
  }

  private monitorMemoryUsage(): void {
    const updateMemoryUsage = () => {
      const usage = process.memoryUsage();
      this.currentMemoryUsage = usage.heapUsed;
      
      // Emit memory usage event
      this.emit('memoryUsage', {
        current: this.currentMemoryUsage,
        max: this.MAX_MEMORY_USAGE,
        percentage: (this.currentMemoryUsage / this.MAX_MEMORY_USAGE) * 100
      });
    };

    setInterval(updateMemoryUsage, 1000);
  }

  /**
   * Cleanup routines
   */
  private async runCleanup(): Promise<void> {
    // Clear completed tasks
    this.clearCompletedTasks();

    // Clear expired cache entries
    await imageCache.cleanup();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Emit cleanup event
    this.emit('cleanup', {
      queueSize: this.queue.size,
      activeProcessing: this.activeProcessing,
      memoryUsage: this.currentMemoryUsage
    });
  }

  private cleanupTask(taskId: string): void {
    const task = this.queue.get(taskId);
    if (!task) return;

    // Update memory usage
    if (task.memoryUsage) {
      this.currentMemoryUsage -= task.memoryUsage;
    }

    // Remove from queue
    this.queue.delete(taskId);
    this.activeProcessing--;

    // Continue processing queue
    this.startProcessing();
  }

  /**
   * Helper methods
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Cleanup on process exit
   */
  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.queue.clear();
    this.batchQueues.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();

// Cleanup on process exit
process.on('exit', () => {
  imageProcessor.dispose();
});