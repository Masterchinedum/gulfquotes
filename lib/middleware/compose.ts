import { NextResponse } from "next/server";
import { AppError } from "@/lib/api-error";

type Middleware = (request: Request) => Promise<Response | void>;

export function composeMiddleware(...middlewares: Middleware[]) {
  return async function(request: Request): Promise<Response | void> {
    try {
      for (const middleware of middlewares) {
        const result = await middleware(request);
        if (result instanceof Response) {
          return result;
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { 
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          },
          { status: error.statusCode }
        );
      }

      console.error("[Middleware Error]", error);
      return NextResponse.json(
        { 
          error: { 
            code: "INTERNAL_ERROR", 
            message: "Internal server error" 
          }
        },
        { status: 500 }
      );
    }
  };
}