import { ApiError, QuoteErrorCode } from "@/types/api/quotes";
import { ZodError } from "zod";

export class AppError extends Error {
  code: QuoteErrorCode;
  statusCode: number;
  details?: Record<string, string[]>;

  constructor(
    message: string, 
    code: QuoteErrorCode, 
    statusCode: number = 400, 
    details?: Record<string, string[]>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatZodError(error: ZodError): ApiError {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details,
  };
}