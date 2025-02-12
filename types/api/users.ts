import { Prisma } from "@prisma/client";

// Base API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// User specific types
export interface UserProfileData {
  username: string | null;
  bio: string | null;
  slug: string;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userProfile?: UserProfileData | null;
}

export interface UsersListData {
  items: UserData[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export type UsersResponse = ApiResponse<UsersListData>;

// Request Parameter Types
export interface UserFilterParams {
  search?: string;
}

export interface UserPaginationParams {
  page?: number;
  limit?: number;
}

// Combined params type
export interface ListUsersParams extends UserFilterParams, UserPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Prisma Where Input Type
export type UserWhereInput = Prisma.UserWhereInput;

// Add these new types
export type UserErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export interface UserResponse extends ApiResponse<UserData> {
  error?: {
    code: UserErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Profile update input type
export interface UpdateProfileInput {
  username?: string;
  bio?: string;
}

// Settings update response
export interface SettingsResponse extends ApiResponse<UserData> {
  error?: {
    code: UserErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}