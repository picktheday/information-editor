"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, Superscript, Subscript } from "lucide-react"

interface BasicDropdownProps {
  onSelect: (command: string) => void
}

export function BasicDropdown({ onSelect }: BasicDropdownProps) {
  console.log("BasicDropdown rendering")

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        console.log("Dropdown open state changed:", open)
      }}
    >
      <DropdownMenu.Trigger className="h-7 px-2 inline-flex items-center gap-1 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
        <span className="text-xs">Erweitert</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={5}
          onCloseAutoFocus={(e) => {
            console.log("Content close auto focus")
            e.preventDefault()
          }}
          onEscapeKeyDown={() => {
            console.log("Escape key pressed")
          }}
          onPointerDownOutside={() => {
            console.log("Pointer down outside")
          }}
        >
          <DropdownMenu.Item
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onSelect={() => {
              console.log("Superscript selected")
              onSelect("superscript")
            }}
          >
            <Superscript className="mr-2 h-4 w-4" />
            <span>Hochgestellt</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onSelect={() => {
              console.log("Subscript selected")
              onSelect("subscript")
            }}
          >
            <Subscript className="mr-2 h-4 w-4" />
            <span>Tiefgestellt</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

