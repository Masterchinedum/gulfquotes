import { Quote, AuthorProfile, Category } from "@prisma/client";
import type { QuoteImageResource } from "@/types/cloudinary";
import type { MediaLibraryItem } from "@/types/cloudinary";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";

export interface ListQuotesResult {
  items: Array<Quote & {
    authorProfile: AuthorProfile & { image?: string | null };
    category: Category;
  }>;
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface QuoteImageData extends Omit<QuoteImageResource, 'context'> {
  url: string;
  publicId: string;
  isActive: boolean;
  isGlobal?: boolean;
  title?: string;
  description?: string;
  altText?: string;
  format: string;
  width: number;
  height: number;
  resource_type: 'image';
  created_at: string;
  bytes: number;
  folder: string;
  secure_url: string;
  usageCount?: number;
}

export type SortOption = 'recent' | 'popular' | 'length' | 'alphabetical';

export interface EnhancedQuote extends Quote {
  isLiked?: boolean;
}

export interface QuoteService {
  list(params: import('@/types/api/quotes').ListQuotesParams & { userId?: string }): Promise<ListQuotesResult>;
  create(data: CreateQuoteInput & { authorId: string; images?: QuoteImageData[] }): Promise<Quote>;
  getById(id: string, userId?: string): Promise<Quote | null>;
  getBySlug(slug: string, userId?: string): Promise<Quote | null>;
  update(id: string, data: UpdateQuoteInput): Promise<Quote>;
  delete(id: string): Promise<Quote>;
  search(query: string): Promise<Quote[]>;
  addImages(quoteId: string, images: QuoteImageData[]): Promise<Quote>;
  addFromMediaLibrary(quoteId: string, images: MediaLibraryItem[]): Promise<Quote>;
  removeImage(quoteId: string, publicId: string): Promise<Quote>;
  setBackgroundImage(quoteId: string, imageUrl: string | null): Promise<Quote>;
  removeImageAssociation(quoteId: string, imageId: string): Promise<Quote>;
}
