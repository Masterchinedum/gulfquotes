import { Loader2 } from "lucide-react";
import { Quote as QuoteIcon } from "lucide-react";

export const Icons = {
  spinner: Loader2,
  quote: QuoteIcon
} as const;

export type Icon = keyof typeof Icons;