import { 
  Loader2,
  Quote as QuoteIcon,
  Plus,
  Search,
  FileQuestion
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  quote: QuoteIcon,
  plus: Plus,
  search: Search,
  empty: FileQuestion
} as const;

export type Icon = keyof typeof Icons;