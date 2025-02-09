import { AuthorProfile } from "@prisma/client";
import { CreateAuthorProfileInput, UpdateAuthorProfileInput } from "@/schemas/author-profile";

export interface AuthorProfileListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AuthorProfileListResponse {
  items: AuthorProfile[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface AuthorProfileService {
  create(data: CreateAuthorProfileInput): Promise<AuthorProfile>;
  update(id: string, data: UpdateAuthorProfileInput): Promise<AuthorProfile>;
  delete(id: string): Promise<AuthorProfile>;
  getById(id: string): Promise<AuthorProfile | null>;
  getBySlug(slug: string): Promise<AuthorProfile | null>;
  list(params: AuthorProfileListParams): Promise<AuthorProfileListResponse>;
}