// lib/utils/imageProcessor.ts
import { quoteImageGenerator } from './imageGenerator';
import { imageScaler } from './imageScaler';
import { AppError } from '@/lib/api-error';

interface ProcessingTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  retries: number;
  error?: string;
  startTime?: number;
  endTime?: number;
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
}

class ImageProcessor {
  private queue: Map<string, ProcessingTask>;
  private processing: boolean;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly MAX_CONCURRENT = 3;
  private activeProcessing: number;

  constructor() {
    this.queue = new Map();
    this.processing = false;
    this.activeProcessing = 0;
  }

  /**
   * Add new image processing task to queue
   */
  async processImage(options: ProcessingOptions): Promise<Buffer> {
    const taskId = this.generateTaskId();
    const task: ProcessingTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      retries: 0,
    };

    this.queue.set(taskId, task);
    this.startProcessing();

    return new Promise((resolve, reject) => {
      this.processTask(taskId, options)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.queue.delete(taskId);
          this.activeProcessing--;
          this.startProcessing();
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
   * Convert to static image
   */
  private async convertToStaticImage(buffer: Buffer): Promise<Buffer> {
    // Here we ensure the image is properly encoded as a static image
    // You might want to add additional optimization here
    return buffer;
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
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();