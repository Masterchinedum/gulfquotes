// app/(general)/quotes/[slug]/components/quote-actions.tsx
"use client"

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";
import { QuoteBackgroundSwitcher } from "./quote-background-switcher";
import { QuoteDownload } from "./quote-download";
import { QuoteShare } from "./quote-share";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteActionsProps {
  quote: QuoteDisplayData;
  backgrounds: Array<Gallery & {
    isActive?: boolean;
    isBackground?: boolean;
  }>;
  activeBackground: Gallery | null;
  onBackgroundChange: (background: Gallery) => Promise<void>;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function QuoteActions({
  quote,
  backgrounds,
  activeBackground,
  onBackgroundChange,
  containerRef,
  className
}: QuoteActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("backgrounds");

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backgrounds">
            <ImageIcon className="h-4 w-4 mr-2" />
            Backgrounds
          </TabsTrigger>
          <TabsTrigger value="download">
            <Download className="h-4 w-4 mr-2" />
            Download
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
        </TabsList>

        {/* Background Selection */}
        {activeTab === "backgrounds" && (
          <div className="pt-4">
            <QuoteBackgroundSwitcher
              backgrounds={backgrounds}
              activeBackground={activeBackground}
              onBackgroundChange={onBackgroundChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Download Options */}
        {activeTab === "download" && (
          <div className="pt-4">
            <QuoteDownload
              containerRef={containerRef}
              filename={`quote-${quote.slug}`}
              onBeforeDownload={() => setIsLoading(true)}
              onAfterDownload={() => setIsLoading(false)}
            />
          </div>
        )}

        {/* Share Options */}
        {activeTab === "share" && (
          <div className="pt-4">
            <QuoteShare
              quote={quote}
              containerRef={containerRef}
              onShareStart={() => setIsLoading(true)}
              onShareComplete={() => setIsLoading(false)}
            />
          </div>
        )}
      </Tabs>
    </div>
  );
}