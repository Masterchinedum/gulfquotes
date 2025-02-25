// app/(general)/quotes/[slug]/components/types.ts
import type { Quote, Gallery } from "@prisma/client";

export interface QuoteDisplayData extends Quote {
  authorProfile: {
    name: string;
    slug: string;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
  gallery: Array<{
    gallery: Gallery;
    isActive: boolean;
    isBackground: boolean;
  }>;
}

export interface QuoteDisplayConfig {
  dimensions: {
    width: number;
    height: number;
    padding: number;
  };
  fontSize: number;
  padding: number;
  backgroundImage: string | null;
}