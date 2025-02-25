// lib/services/public-quote/types.ts
import type { Quote, Gallery } from "@prisma/client";

export interface QuoteDisplayData extends Quote {
  authorProfile: {
    name: string;
    slug: string;
    image?: string | null;
    bio?: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
  gallery: Array<{
    gallery: Gallery;
    isActive: boolean;
    isBackground: boolean;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  metrics?: {
    views: number;
    likes: number;
    shares: number;
  };
}

export interface QuoteDisplayConfig {
  fontSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  background?: {
    url: string;
    style: string;
  };
}