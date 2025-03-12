'use client'

import { Button } from "@/components/ui/button";

export function ReloadButton() {
  return (
    <Button 
      variant="outline" 
      onClick={() => window.location.reload()} 
      className="mt-4"
    >
      Try again
    </Button>
  );
}