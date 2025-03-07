// Create this file at /lib/exceptions.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string = "INTERNAL_ERROR",
    public statusCode: number = 500,
    public details?: Record<string, unknown> // Changed from any to unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}