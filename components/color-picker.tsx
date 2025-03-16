"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface ColorOption {
  value: string
  label: string
  class: string
  background: string
}

const colorOptions: ColorOption[] = [
  { value: "default", label: "Standard", class: "text-foreground", background: "bg-background" },
  { value: "red", label: "Rot", class: "text-red-500", background: "bg-red-500" },
  { value: "green", label: "Grün", class: "text-green-500", background: "bg-green-500" },
  { value: "blue", label: "Blau", class: "text-blue-500", background: "bg-blue-500" },
  { value: "yellow", label: "Gelb", class: "text-yellow-500", background: "bg-yellow-500" },
  { value: "purple", label: "Lila", class: "text-purple-500", background: "bg-purple-500" },
]

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  useEffect(() => {
    console.log("ColorPicker mounted with value:", value)
  }, [value])

  return (
    <div className="w-full rounded-md bg-popover">
      <div className="flex flex-col space-y-1.5 p-3">
        <h3 className="text-sm font-medium leading-none">Textfarbe</h3>
        <p className="text-xs text-muted-foreground">Wählen Sie eine Farbe</p>
      </div>
      <div className="grid grid-cols-3 gap-1 p-3">
        {colorOptions.map((option) => {
          console.log("Rendering color option:", option.value)
          return (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              className={cn(
                "flex h-12 w-full flex-col items-center justify-center gap-1 p-1",
                option.value === value && "border-2 border-primary",
              )}
              onClick={() => {
                console.log("Color option clicked:", option.value)
                onChange(option.value)
              }}
            >
              <span
                className={cn(
                  "h-6 w-6 rounded-md border",
                  option.background,
                  option.value === "default" && "bg-background dark:bg-secondary",
                )}
              >
                {value === option.value && (
                  <Check
                    className={cn("h-full w-full p-1", option.value === "default" ? "text-foreground" : "text-white")}
                  />
                )}
              </span>
              <span className="text-[10px]">{option.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

