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

export class ImageUploadError extends AppError {
  constructor(message: string = "Failed to upload image") {
    super(message, "IMAGE_UPLOAD_ERROR", 400);
  }
}

export class ImageDeleteError extends AppError {
  constructor(message: string = "Failed to delete image") {
    super(message, "IMAGE_DELETE_ERROR", 400);
  }
}

export class MaxImagesExceededError extends AppError {
  constructor(message: string = "Maximum number of images exceeded") {
    super(message, "MAX_IMAGES_EXCEEDED", 400);
  }
}

export class InvalidImageError extends AppError {
  constructor(message: string = "Invalid image format or size") {
    super(message, "INVALID_IMAGE", 400);
  }
}