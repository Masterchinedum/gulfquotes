import { 
  Loader2, 
  Quote as QuoteIcon,
  Pencil,
  Trash,
  Plus,
  MoreVertical,
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  quote: QuoteIcon,
  pencil: Pencil,
  edit: Pencil, 
  trash: Trash,
  plus: Plus,
  more: MoreVertical,
} as const;

export type Icon = keyof typeof Icons;