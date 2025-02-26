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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteActionsProps {
  quote: QuoteDisplayData;
  backgrounds: Gallery[];
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
  const [quality, setQuality] = useState<"high" | "standard" | "web">("standard");

  return (
    <div className={cn("space-y-6", className)}>
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
          <div className="pt-4 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Quality Settings</h3>
              <RadioGroup
                value={quality}
                onValueChange={(value) => setQuality(value as typeof quality)}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="high" id="high" className="peer sr-only" />
                  <Label
                    htmlFor="high"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>High</span>
                    <span className="text-xs text-muted-foreground">3x Scale</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                  <Label
                    htmlFor="standard"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Standard</span>
                    <span className="text-xs text-muted-foreground">2x Scale</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="web" id="web" className="peer sr-only" />
                  <Label
                    htmlFor="web"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Web</span>
                    <span className="text-xs text-muted-foreground">1.5x Scale</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <QuoteDownload
              containerRef={containerRef}
              filename={`quote-${quote.slug}`}
              onBeforeDownload={() => setIsLoading(true)}
              onAfterDownload={() => setIsLoading(false)}
              quality={quality}
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