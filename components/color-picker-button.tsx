"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Palette } from "lucide-react"

interface ColorPickerButtonProps {
  value: string
  onChange: (value: string) => void
}

const colorOptions = [
  {
    value: "default",
    label: "Standard",
    background: "bg-background dark:bg-secondary",
  },
  {
    value: "slate",
    label: "Grau",
    background: "bg-slate-500",
  },
  {
    value: "red",
    label: "Rot",
    background: "bg-red-500",
  },
  {
    value: "green",
    label: "Grün",
    background: "bg-green-500",
  },
  {
    value: "blue",
    label: "Blau",
    background: "bg-blue-500",
  },
  {
    value: "yellow",
    label: "Gelb",
    background: "bg-yellow-500",
  },
  {
    value: "purple",
    label: "Lila",
    background: "bg-purple-500",
  },
]

export function ColorPickerButton({ value, onChange }: ColorPickerButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  console.log("ColorPickerButton state initialized:", { isOpen, value })
  const containerRef = React.useRef<HTMLDivElement>(null)
  console.log("ColorPickerButton ref initialized:", {
    hasRef: !!containerRef.current,
    value,
  })

  const toggleOpen = () => {
    console.group("=== ColorPicker Toggle ===")
    console.log("Toggle state:", {
      currentIsOpen: isOpen,
      willBe: !isOpen,
      currentValue: value,
      activeElement: document.activeElement,
      hasSelection: !!window.getSelection()?.toString(),
    })
    setIsOpen(!isOpen)
    console.groupEnd()
  }

  React.useEffect(() => {
    console.log("ColorPickerButton mounted, initial value:", value)
    console.log("ColorPickerButton effect running with isOpen:", isOpen)

    function handleClickOutside(event: MouseEvent) {
      console.group("=== Click Outside ===")
      console.log("Click outside event:", {
        target: event.target,
        isContainer: containerRef.current?.contains(event.target as Node),
        isOpen,
        currentValue: value,
        activeElement: document.activeElement,
      })

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        console.log("Closing dropdown")
        setIsOpen(false)
      }
      console.groupEnd()
    }

    if (isOpen) {
      console.log("ColorPicker adding click outside listener, current value:", value)
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      console.group("=== ColorPicker Cleanup ===")
      console.log("Effect cleanup:", {
        isOpen,
        value,
        hasContainer: !!containerRef.current,
        activeElement: document.activeElement,
      })
      if (isOpen) {
        console.log("Removing click outside listener")
        document.removeEventListener("mousedown", handleClickOutside)
      }
      console.groupEnd()
    }
  }, [isOpen, value])

  console.log("ColorPickerButton render:", { isOpen, value })

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => console.log("ColorPicker container mouse enter")}
      onMouseLeave={() => console.log("ColorPicker container mouse leave")}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("h-7 w-7 relative", value !== "default" && "bg-accent text-accent-foreground")}
        onClick={toggleOpen}
      >
        <Palette className="h-3.5 w-3.5" />
        {value !== "default" && (
          <span className={cn("absolute bottom-0 right-0 h-2 w-2 rounded-full", `bg-${value}-500`)} />
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-md border bg-popover p-1 shadow-md"
          onMouseEnter={() => console.log("ColorPicker dropdown mouse enter")}
          onMouseLeave={() => console.log("ColorPicker dropdown mouse leave")}
        >
          <div className="flex flex-col space-y-1.5 px-3 pt-3 pb-2">
            <h3 className="text-sm font-medium leading-none">Textfarbe</h3>
            <p className="text-xs text-muted-foreground">Wählen Sie eine Farbe</p>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1">
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
                    console.group("=== Color Option Click ===")
                    console.log("Color selected:", {
                      value: option.value,
                      currentValue: value,
                      isOpen,
                      activeElement: document.activeElement,
                    })
                    onChange(option.value)
                    setIsOpen(false)
                    console.groupEnd()
                  }}
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-md border",
                      option.background,
                      option.value === "default" && "bg-background dark:bg-secondary",
                    )}
                  />
                  <span className="text-[10px]">{option.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

