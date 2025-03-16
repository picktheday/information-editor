"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Define a custom interface that extends HTMLAttributes and adds our custom props
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = false, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? undefined : "separator"}
      aria-orientation={orientation === "horizontal" ? "horizontal" : "vertical"}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  ),
)
Separator.displayName = "Separator"

export { Separator }

