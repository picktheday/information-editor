"use client"

import * as React from "react"
import { PaintBucket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorOption {
  value: string
  label: string
  background: string
}

const colorOptions: ColorOption[] = [
  { value: "default", label: "Standard", background: "bg-transparent" },
  { value: "red", label: "Rot", background: "bg-red-100" },
  { value: "green", label: "Grün", background: "bg-green-100" },
  { value: "blue", label: "Blau", background: "bg-blue-100" },
  { value: "yellow", label: "Gelb", background: "bg-yellow-100" },
  { value: "purple", label: "Lila", background: "bg-purple-100" },
]

interface BackgroundColorPickerButtonProps {
  value: string
  onChange: (value: string) => void
}

export function BackgroundColorPickerButton({ value, onChange }: BackgroundColorPickerButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    console.log("BackgroundColorPickerButton mounted")

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = colorOptions.find((option) => option.value === value)

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("h-7 w-7 relative", value !== "default" && "bg-accent text-accent-foreground")}
        onClick={() => {
          console.log("BackgroundColorPickerButton clicked, toggling dropdown")
          setIsOpen(!isOpen)
        }}
      >
        <PaintBucket className="h-3.5 w-3.5" />
        {value !== "default" && selectedOption && (
          <div className={cn("absolute bottom-0 right-0 h-2 w-2 rounded-full", selectedOption.background)} />
        )}
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-md border bg-popover p-1 shadow-md">
          <div className="flex flex-col space-y-1.5 px-3 pt-3 pb-2">
            <h3 className="text-sm font-medium leading-none">Hintergrundfarbe</h3>
            <p className="text-xs text-muted-foreground">Wählen Sie eine Hintergrundfarbe</p>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1">
            {colorOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                className={cn(
                  "flex h-12 w-full flex-col items-center justify-center gap-1 p-1",
                  option.value === value && "border-2 border-primary",
                )}
                onClick={() => {
                  console.log("Background color option clicked:", option.value)
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <div className={cn("h-6 w-6 rounded-md border", option.background)} />
                <span className="text-[10px]">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

