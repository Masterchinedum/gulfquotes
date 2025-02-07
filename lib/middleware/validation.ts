import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { formatZodError } from "@/lib/api-error";

export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return async function validationMiddleware(request: Request): Promise<Response | void> {
    try {
      const body = await request.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: formatZodError(result.error) },
          { status: 400 }
        );
      }

      // Attach the validated data to the request object
      const req = request as Request & { validated: T };
      req.validated = result.data;

    } catch {
      return NextResponse.json(
        { 
          error: { 
            code: "INVALID_REQUEST", 
            message: "Invalid request body" 
          } 
        },
        { status: 400 }
      );
    }
  };
}