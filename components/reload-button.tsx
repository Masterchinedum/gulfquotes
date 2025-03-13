"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function ReloadButton() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Button 
      onClick={handleReload}
      variant="outline"
      className="mt-4"
    >
      <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
    </Button>
  );
}