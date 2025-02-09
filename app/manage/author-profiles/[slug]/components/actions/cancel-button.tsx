// File: app/manage/author-profiles/[slug]/components/actions/cancel-button.tsx
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CancelButton() {
  const router = useRouter();

  return (
    <Button 
      type="button" 
      variant="outline"
      onClick={() => router.push("/manage/author-profiles")}
    >
      Cancel
    </Button>
  );
}