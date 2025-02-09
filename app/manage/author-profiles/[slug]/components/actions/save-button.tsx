// File: app/manage/author-profiles/[slug]/components/actions/save-button.tsx
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

interface SaveButtonProps {
  isSubmitting: boolean;
}

export function SaveButton({ isSubmitting }: SaveButtonProps) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting && (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      )}
      Save Changes
    </Button>
  );
}