"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const alphabet = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function AlphabetNav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentLetter = searchParams.get("letter") || ""

  const handleLetterClick = useCallback(
    (letter: string) => {
      const params = new URLSearchParams(searchParams)
      if (letter === "#") {
        params.delete("letter")
      } else {
        params.set("letter", letter)
      }
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full overflow-auto">
        <div className="flex min-w-max gap-1 py-4">
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={currentLetter === letter ? "default" : "ghost"}
              size="sm"
              className={cn(
                "min-w-[32px]",
                currentLetter === letter && "pointer-events-none"
              )}
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}