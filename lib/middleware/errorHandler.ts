import { NextResponse } from "next/server";
import { ValidationResult } from "@/types/auth";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function handleAuthError(error: Error): NextResponse {
  const statusCode = error instanceof AuthorizationError ? 403 : 500;
  const message = error instanceof AuthorizationError ? error.message : "Internal server error";

  return new NextResponse(
    JSON.stringify({
      success: false,
      message
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export function createErrorResponse(result: ValidationResult): NextResponse {
  return new NextResponse(
    JSON.stringify({
      success: false,
      message: result.error || "Validation failed"
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" }
    }
  );
}