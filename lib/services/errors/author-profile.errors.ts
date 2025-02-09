import { AppError } from "@/lib/api-error";

export class AuthorProfileNotFoundError extends AppError {
  constructor(message: string = "Author profile not found") {
    super(message, "AUTHOR_PROFILE_NOT_FOUND", 404);
  }
}

export class DuplicateAuthorProfileError extends AppError {
  constructor(message: string = "Author profile with this name already exists") {
    super(message, "DUPLICATE_AUTHOR_PROFILE", 400);
  }
}

export class InvalidAuthorProfileDataError extends AppError {
  constructor(message: string = "Invalid author profile data") {
    super(message, "INVALID_AUTHOR_PROFILE_DATA", 400);
  }
}

export class AuthorProfileValidationError extends AppError {
  constructor(message: string = "Author profile validation failed") {
    super(message, "AUTHOR_PROFILE_VALIDATION", 400);
  }
}