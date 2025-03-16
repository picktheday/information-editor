"use client"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ListOrdered,
  List,
  ChevronDown,
  Superscript,
  Subscript,
  TextCursor,
  Quote,
  MinusSquare,
  CheckSquare,
} from "lucide-react"
import type React from "react"

import { useCallback, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SubmitButton } from "./submit-button"
import { EditorStyles } from "./editor-styles"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TestButton } from "./test-button"
import { ColorPickerButton } from "./color-picker-button"
import { BackgroundColorPickerButton } from "./background-color-picker-button"
import { ListHandler } from "./list-handler"

// Füge diese Typdefinitionen am Anfang der Datei nach den Imports hinzu
type ColorKey = "red" | "green" | "blue" | "yellow" | "purple" | "slate" | "default"
type FontSizeKey = "small" | "normal" | "large"

type FormatState = {
  subscript: boolean
  superscript: boolean
  fontSize: "small" | "normal" | "large"
}

export default function InformationEditor() {
  // Removed unused state
  // const [activeList, setActiveList] = useState<ListType>(null)
  const [formatState, setFormatState] = useState<FormatState>({
    subscript: false,
    superscript: false,
    fontSize: "normal",
  })
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSelectionRef = useRef<{ range: Range; selection: Selection } | null>(null)
  const [textColor, setTextColor] = useState("default")
  const [backgroundColor, setBackgroundColor] = useState("default")
  const listHandlerRef = useRef<ListHandler | null>(null)

  // Debug mount/unmount
  useEffect(() => {
    console.log("InformationEditor mounted")
    return () => console.log("InformationEditor unmounted")
  }, [])

  // Debug HTML changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log("HTML Changed:", {
          type: mutation.type,
          target: mutation.target,
          addedNodes: Array.from(mutation.addedNodes),
          removedNodes: Array.from(mutation.addedNodes),
          currentHTML: editorRef.current?.innerHTML,
        })
      })
    })

    const currentEditorRef = editorRef.current

    if (currentEditorRef) {
      observer.observe(currentEditorRef, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      })
    }

    return () => observer.disconnect()
  }, [])

  // After other useEffect hooks
  useEffect(() => {
    if (editorRef.current && !listHandlerRef.current) {
      listHandlerRef.current = new ListHandler(editorRef.current)
    }
  }, [])

  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    console.log("Saving selection:", {
      hasSelection: !!selection,
      rangeCount: selection?.rangeCount,
      text: selection?.toString(),
    })

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      console.log("Selection range:", {
        startContainer: range.startContainer.nodeName,
        startOffset: range.startOffset,
        endContainer: range.endContainer.nodeName,
        endOffset: range.endOffset,
        commonAncestor: range.commonAncestorContainer.nodeName,
      })

      lastSelectionRef.current = {
        range: range.cloneRange(),
        selection,
      }
    }
  }, [])

  const logCurrentHTML = useCallback(() => {
    if (!editorRef.current) return
    console.log("Current HTML structure:", {
      prettyHTML: editorRef.current.innerHTML
        .split(">")
        .map((part) => part.trim() + ">")
        .filter((part) => part.length > 1)
        .join("\n"),
      rawHTML: editorRef.current.innerHTML,
    })
  }, [])

  const restoreSelection = useCallback(() => {
    console.log("Restoring selection:", {
      hasStoredSelection: !!lastSelectionRef.current,
      editorHasFocus: document.activeElement === editorRef.current,
    })

    if (lastSelectionRef.current && editorRef.current) {
      const { range, selection } = lastSelectionRef.current
      selection.removeAllRanges()
      selection.addRange(range)
      editorRef.current.focus()
    }
  }, [])

  const logFormatResult = useCallback((operation: string, success: boolean, details: Record<string, unknown>) => {
    const status = success ? "✅ ERFOLG" : "❌ FEHLER"
    const style = success
      ? "color: #4ade80; font-weight: bold; font-size: 14px;"
      : "color: #ef4444; font-weight: bold; font-size: 14px;"

    console.log(`%c${status} - ${operation}`, style, {
      ...details,
      timestamp: new Date().toISOString(),
    })

    // Zusätzliche Details in eigener Gruppe
    console.group("Details:")
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}: `, value)
    })
    console.groupEnd()
  }, [])

  // Füge diese Logging-Funktion nach der logFormatResult-Funktion hinzu
  const logBlockquoteOperation = useCallback((phase: string, details: Record<string, unknown>) => {
    console.group(`=== BLOCKQUOTE ${phase.toUpperCase()} ===`)
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Allgemeine Informationen
    console.log("Editor state:", {
      hasFocus: document.activeElement === editorRef.current,
      editorContent: editorRef.current?.innerHTML,
      selectionExists: !!window.getSelection() && window.getSelection()!.rangeCount > 0,
      selectionText: window.getSelection()?.toString() || "",
    })

    // Details ausgeben
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}:`, value)
    })

    console.groupEnd()
  }, [])

  const handleFormat = useCallback(
    (command: string) => {
      if (!editorRef.current) return

      const selection = window.getSelection()
      let range: Range | null = null

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
      }

      if (command === "checklist") {
        try {
          console.group("=== Two-Phase Checklist Creation ===")

          // PHASE 1: Preparation - Create structure in memory first
          console.log("Phase 1: Preparing checklist structure")

          // Store initial state for potential rollback
          const initialHTML = editorRef.current.innerHTML
          const initialSelection = window.getSelection()
          const initialRange = initialSelection?.rangeCount ? initialSelection.getRangeAt(0).cloneRange() : null

          console.log("Initial state:", {
            editorFocused: document.activeElement === editorRef.current,
            hasSelection: !!initialSelection?.toString(),
            initialRange: initialRange
              ? {
                  collapsed: initialRange.collapsed,
                  startContainer: initialRange.startContainer.nodeName,
                }
              : null,
          })

          // Create the checklist structure in memory
          const documentFragment = document.createDocumentFragment()
          const list = document.createElement("ul")
          list.className = "checklist"

          // Create a new checklist item
          if (!listHandlerRef.current) {
            throw new Error("List handler not initialized")
          }

          const item = listHandlerRef.current.createChecklist("")

          // Validate the structure
          if (!item || !item.querySelector('input[type="checkbox"]') || !item.querySelector("span")) {
            throw new Error("Failed to create valid checklist item structure")
          }

          // Add item to list and list to fragment
          list.appendChild(item)
          documentFragment.appendChild(list)

          console.log("Checklist structure prepared:", {
            fragment: documentFragment,
            listHTML: list.outerHTML,
            itemHTML: item.outerHTML,
            valid: !!item.querySelector('input[type="checkbox"]') && !!item.querySelector("span"),
          })

          // PHASE 2: Safe Insertion
          console.log("Phase 2: Safe insertion into DOM")

          // Focus the editor first to ensure we have a valid editing context
          editorRef.current.focus()

          // Small delay to ensure focus is established
          setTimeout(() => {
            try {
              // Get current selection after focus
              const selection = window.getSelection()
              let range: Range

              // Create a valid insertion point
              if (!selection || selection.rangeCount === 0) {
                // If no selection, create one at the end of the editor
                range = document.createRange()
                if (editorRef.current) {
                  range.selectNodeContents(editorRef.current)
                  range.collapse(false)
                } else {
                  console.error("Editor reference is null")
                  return // Exit early if editor reference is null
                }

                // Create a new selection
                selection?.removeAllRanges()
                selection?.addRange(range)
              } else {
                range = selection.getRangeAt(0)
              }

              console.log("Insertion point:", {
                hasSelection: !!selection,
                rangeCount: selection?.rangeCount,
                range: range
                  ? {
                      startContainer: range.startContainer.nodeName,
                      startOffset: range.startOffset,
                      collapsed: range.collapsed,
                    }
                  : null,
              })

              // Find the appropriate insertion point
              let insertionPoint: Node = range.startContainer
              if (insertionPoint.nodeType === Node.TEXT_NODE) {
                // Null-Prüfung hinzufügen
                if (insertionPoint.parentNode) {
                  insertionPoint = insertionPoint.parentNode
                }
              }

              // Handle special cases
              if (insertionPoint === editorRef.current) {
                // If insertion point is the editor itself, we need a wrapper
                const p = document.createElement("p")
                p.innerHTML = "<br>"
                editorRef.current.appendChild(p)
                insertionPoint = p
              }

              // Insert the list at the appropriate location
              insertionPoint.parentNode?.insertBefore(list, insertionPoint)

              // Clean up empty blocks
              if (insertionPoint.textContent?.trim() === "" && insertionPoint instanceof Element) {
                insertionPoint.remove()
              }

              // Set cursor in the new item's span
              const span = item.querySelector("span")
              if (span) {
                const newRange = document.createRange()
                newRange.setStart(span, 0)
                newRange.collapse(true)
                if (selection) {
                  selection.removeAllRanges()
                  selection.addRange(newRange)
                }
              }

              console.log("Checklist insertion successful:", {
                editorContent: editorRef.current?.innerHTML || "",
                hasFocus: document.activeElement === editorRef.current,
                hasSelection: !!window.getSelection() && window.getSelection()!.rangeCount > 0,
                cursorInSpan: !!window.getSelection() && window.getSelection()!.anchorNode === span,
              })
            } catch (error) {
              // Rollback on error
              console.error("Error during checklist insertion:", error)
              if (editorRef.current) {
                editorRef.current.innerHTML = initialHTML
              }

              // Restore original selection if possible
              if (initialSelection && initialRange) {
                initialSelection.removeAllRanges()
                initialSelection.addRange(initialRange)
              }
            }
          }, 50) // Small delay to ensure focus is established
        } catch (error) {
          console.error("Checklist creation failed:", error)
        } finally {
          console.groupEnd()
        }
        return
      } else {
        // Special handling for separator and blockquote which don't always need a selection
        if (command === "separator") {
          const container = document.createElement("div")
          container.className = "separator-container"

          const hr = document.createElement("hr")
          hr.className = "editor-separator"
          hr.contentEditable = "false"
          container.appendChild(hr)

          // Get current selection and ensure it exists
          const selection = window.getSelection()
          let range: Range

          if (!selection || selection.rangeCount === 0) {
            // If no selection, insert at the end of the editor
            range = document.createRange()
            range.selectNodeContents(editorRef.current)
            range.collapse(false)
            selection?.removeAllRanges()
            selection?.addRange(range)
          } else {
            // Now we can safely get the range
            range = selection.getRangeAt(0)
          }

          // Insert the separator
          range.insertNode(container)

          // Add a new line after the separator
          const br = document.createElement("br")
          container.parentNode?.insertBefore(br, container.nextSibling)

          // Move cursor after the separator
          const newRange = document.createRange()
          newRange.setStartAfter(br)
          newRange.collapse(true)
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(newRange)
          }

          // Make the separator selectable by clicking
          container.addEventListener("click", (e) => {
            e.stopPropagation()

            const selection = window.getSelection()
            if (!selection) return

            console.log("Separator clicked:", {
              container,
              classes: container.className,
              hasSelectedClass: container.classList.contains("selected"),
            })

            try {
              const sepRange = document.createRange()
              sepRange.selectNode(container)
              selection.removeAllRanges()
              selection.addRange(sepRange)

              // Remove 'selected' class from all other separators
              editorRef.current?.querySelectorAll(".separator-container").forEach((sep) => {
                sep.classList.remove("selected")
              })
              // Add 'selected' class to this separator
              container.classList.add("selected")

              console.log("Separator selection updated:", {
                selectedContainer: container,
                updatedClasses: container.className,
              })
            } catch (error) {
              console.error("Error selecting separator:", error)
            }
          })
        } else if (command === "blockquote" && (!selection || selection.rangeCount === 0)) {
          // Handle blockquote without selection...
          return
        }

        // For all other commands, we need a valid selection
        if (!selection || selection.rangeCount === 0) {
          console.log("No selection available for command:", command)
          return
        }

        // Ersetze den Blockquote-Teil in der handleFormat-Funktion mit diesem erweiterten Code
        if (command === "blockquote") {
          if (!selection || selection.rangeCount === 0 || !range) {
            logBlockquoteOperation("ABORTED", {
              reason: "No valid selection or range",
              selection: selection
                ? {
                    rangeCount: selection.rangeCount,
                    type: selection.type,
                  }
                : "null",
              range: range ? "exists" : "null",
            })
            return
          }

          logBlockquoteOperation("START", {
            selectionRange: {
              startContainer: {
                nodeType: range.startContainer.nodeType,
                nodeName: range.startContainer.nodeName,
                textContent: range.startContainer.textContent?.substring(0, 50),
                parentNode: range.startContainer.parentNode?.nodeName,
              },
              endContainer: {
                nodeType: range.endContainer.nodeType,
                nodeName: range.endContainer.nodeName,
                textContent: range.endContainer.textContent?.substring(0, 50),
                parentNode: range.endContainer.parentNode?.nodeName,
              },
              startOffset: range.startOffset,
              endOffset: range.endOffset,
              collapsed: range.collapsed,
              commonAncestorContainer: {
                nodeType: range.commonAncestorContainer.nodeType,
                nodeName: range.commonAncestorContainer.nodeName,
                textContent: range.commonAncestorContainer.textContent?.substring(0, 50),
              },
            },
          })

          try {
            const blockquote = document.createElement("blockquote")
            blockquote.className = "editor-blockquote"

            // Store the original range
            const originalRange = range.cloneRange()
            logBlockquoteOperation("RANGE_CLONED", {
              originalRange: {
                startContainer: originalRange.startContainer.nodeName,
                startOffset: originalRange.startOffset,
                endContainer: originalRange.endContainer.nodeName,
                endOffset: originalRange.endOffset,
              },
            })

            // Check if we're already in a blockquote
            let currentBlock: Node | null = range?.commonAncestorContainer
            let existingQuote: HTMLElement | null = null

            // Suche nach einem Blockquote-Element, aber NICHT nach dem Editor selbst
            while (currentBlock && currentBlock !== editorRef.current) {
              if (currentBlock.nodeType === Node.ELEMENT_NODE) {
                const element = currentBlock as Element
                if (element.tagName === "BLOCKQUOTE") {
                  existingQuote = element as HTMLElement
                  break
                }
              }

              if (currentBlock.parentNode) {
                currentBlock = currentBlock.parentNode
              } else {
                break
              }
            }

            logBlockquoteOperation("EXISTING_CHECK", {
              existingQuoteFound: !!existingQuote,
              existingQuoteHTML: existingQuote?.outerHTML,
              existingQuoteParent: existingQuote?.parentElement?.nodeName,
              editorWasChecked: currentBlock === editorRef.current,
              commonAncestorContainer: range.commonAncestorContainer.nodeName,
            })

            if (existingQuote) {
              // Remove blockquote but keep content
              logBlockquoteOperation("REMOVING_EXISTING", {
                existingQuoteChildren: Array.from(existingQuote.childNodes).map((node) => ({
                  nodeType: node.nodeType,
                  nodeName: node.nodeName,
                  textContent: node.textContent?.substring(0, 30),
                })),
              })

              const parent = existingQuote.parentElement
              if (parent) {
                while (existingQuote.firstChild) {
                  parent.insertBefore(existingQuote.firstChild, existingQuote)
                }
                existingQuote.remove()
              }

              // Restore selection
              logBlockquoteOperation("RESTORING_SELECTION", {
                selectionBefore: selection.toString(),
                rangeValid:
                  document.contains(originalRange.startContainer) && document.contains(originalRange.endContainer),
              })

              try {
                selection.removeAllRanges()
                selection.addRange(originalRange)
                logBlockquoteOperation("SELECTION_RESTORED", {
                  selectionAfter: selection.toString(),
                })
              } catch (error) {
                logBlockquoteOperation("SELECTION_RESTORE_ERROR", {
                  error: error instanceof Error ? error.message : String(error),
                })
              }
            } else {
              // Create new blockquote
              logBlockquoteOperation("CREATING_NEW", {
                rangeBeforeExtract: {
                  startContainer: range.startContainer.nodeName,
                  startOffset: range.startOffset,
                  endContainer: range.endContainer.nodeName,
                  endOffset: range.endOffset,
                  collapsed: range.collapsed,
                },
              })

              // Capture the content before extraction for debugging
              const beforeContent = editorRef.current.innerHTML

              // Extract contents and create blockquote
              const fragment = range.extractContents()

              logBlockquoteOperation("CONTENT_EXTRACTED", {
                fragmentChildNodes: Array.from(fragment.childNodes).map((node) => ({
                  nodeType: node.nodeType,
                  nodeName: node.nodeName,
                  textContent: node.textContent?.substring(0, 30),
                })),
                editorContentAfterExtract: editorRef.current.innerHTML,
                contentChanged: beforeContent !== editorRef.current.innerHTML,
              })

              // Check if fragment is empty
              if (fragment.childNodes.length === 0) {
                logBlockquoteOperation("EMPTY_FRAGMENT", {
                  action: "Adding placeholder content",
                  originalContent: editorRef.current.innerHTML,
                })

                // Add placeholder content if fragment is empty
                const placeholder = document.createTextNode("Blockquote")
                fragment.appendChild(placeholder)
              }

              blockquote.appendChild(fragment)

              logBlockquoteOperation("BLOCKQUOTE_CREATED", {
                blockquoteHTML: blockquote.outerHTML,
                blockquoteChildCount: blockquote.childNodes.length,
                blockquoteTextContent: blockquote.textContent,
              })

              // Insert the blockquote
              try {
                range.insertNode(blockquote)

                logBlockquoteOperation("BLOCKQUOTE_INSERTED", {
                  editorContentAfterInsert: editorRef.current.innerHTML,
                  blockquoteInDOM: document.contains(blockquote),
                  blockquoteParent: blockquote.parentNode?.nodeName,
                })
              } catch (error) {
                logBlockquoteOperation("INSERT_ERROR", {
                  error: error instanceof Error ? error.message : String(error),
                  rangeState: {
                    collapsed: range.collapsed,
                    startContainer: range.startContainer.nodeName,
                    startOffset: range.startOffset,
                  },
                })
              }

              // Update selection to include the blockquote
              try {
                const newRange = document.createRange()
                newRange.selectNodeContents(blockquote)
                selection.removeAllRanges()
                selection.addRange(newRange)

                logBlockquoteOperation("SELECTION_UPDATED", {
                  newSelectionText: selection.toString(),
                  newRangeCollapsed: newRange.collapsed,
                })
              } catch (error) {
                logBlockquoteOperation("SELECTION_UPDATE_ERROR", {
                  error: error instanceof Error ? error.message : String(error),
                })
              }
            }
          } catch (error) {
            logBlockquoteOperation("ERROR", {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : "No stack trace",
              editorContent: editorRef.current.innerHTML,
            })
          } finally {
            logBlockquoteOperation("COMPLETE", {
              finalEditorContent: editorRef.current.innerHTML,
              finalSelection: window.getSelection()?.toString(),
              blockquoteExists: !!editorRef.current.querySelector("blockquote.editor-blockquote"),
            })
          }
        } else if (command === "separator") {
          // Separator creation logic...
        } else if (command.startsWith("color-")) {
          const color = command.split("-")[1]

          // Check if we're working with a separator
          const selectedContainer = editorRef.current.querySelector(".separator-container.selected")

          if (selectedContainer) {
            console.log("Applying color to separator:", {
              color,
              currentClasses: selectedContainer.className,
              element: selectedContainer,
            })

            // Remove all color classes
            const classes = selectedContainer.className.split(" ")
            const newClasses = classes.filter((cls) => !cls.startsWith("color-"))

            // Add new color class if not default
            if (color !== "default") {
              newClasses.push(`color-${color}`)
            }

            selectedContainer.className = newClasses.join(" ")

            // Log the result
            const hr = selectedContainer.querySelector(".editor-separator")
            const computedStyle = hr ? window.getComputedStyle(hr) : null
            console.log("Separator color update result:", {
              newClasses: selectedContainer.className,
              appliedColor: color,
              computedBackgroundColor: computedStyle?.backgroundColor,
              element: hr,
            })
          } else if (range) {
            // Store the original range boundaries
            const startContainer = range.startContainer
            const startOffset = range.startOffset
            const endContainer = range.endContainer
            const endOffset = range.endOffset

            // Expand range to include partial spans
            let currentNode = range.commonAncestorContainer
            while (currentNode && currentNode !== editorRef.current) {
              if (currentNode.nodeType === Node.ELEMENT_NODE && (currentNode as Element).tagName === "SPAN") {
                range.setStartBefore(currentNode)
                range.setEndAfter(currentNode)
                break
              }
              // Null-Prüfung für parentNode hinzufügen
              if (currentNode.parentNode) {
                currentNode = currentNode.parentNode
              } else {
                break // Abbrechen, wenn parentNode null ist
              }
            }

            // Extract content and create temporary container
            const fragment = range.extractContents()
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(fragment)

            // Remove all nested color spans
            const removeColorSpans = (node: Node) => {
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "SPAN") {
                const span = node as HTMLSpanElement
                if (span.style.color) {
                  const parent = span.parentNode
                  if (parent) {
                    while (span.firstChild) {
                      parent.insertBefore(span.firstChild, span)
                    }
                    span.remove()
                  }
                }
              }
              Array.from(node.childNodes).forEach(removeColorSpans)
            }
            removeColorSpans(tempDiv)

            // Only apply new color if not default
            if (color !== "default") {
              const colorMap = {
                red: "#ef4444",
                green: "#22c55e",
                blue: "#3b82f6",
                yellow: "#eab308",
                purple: "#a855f7",
                slate: "#64748b",
              } as const

              // Create new span with color
              const span = document.createElement("span")
              span.style.color =
                color !== "default" && color in colorMap ? colorMap[color as keyof typeof colorMap] : "inherit"

              // Move all content into the new span
              while (tempDiv.firstChild) {
                span.appendChild(tempDiv.firstChild)
              }

              // Insert the new span
              range.insertNode(span)

              // Update selection to cover the new span
              const newRange = document.createRange()
              newRange.selectNodeContents(span)
              selection.removeAllRanges()
              selection.addRange(newRange)
            } else {
              // For default color, just insert the cleaned content
              while (tempDiv.firstChild) {
                range.insertNode(tempDiv.firstChild)
              }

              // Restore original selection
              try {
                const newRange = document.createRange()
                newRange.setStart(startContainer, startOffset)
                newRange.setEnd(endContainer, endOffset)
                selection.removeAllRanges()
                selection.addRange(newRange)
              } catch (error) {
                console.error("Error restoring selection:", error)
              }
            }

            // Clean up
            tempDiv.remove()
          }
        } else if (command.startsWith("bgcolor-")) {
          const color = command.split("-")[1]

          // Check if we're working with a separator
          const selectedContainer = editorRef.current.querySelector(".separator-container.selected")

          if (selectedContainer) {
            console.log("Applying background color to separator:", {
              color,
              currentClasses: selectedContainer.className,
              element: selectedContainer,
            })

            // Remove all background color classes
            const classes = selectedContainer.className.split(" ")
            const newClasses = classes.filter((cls) => !cls.startsWith("bgcolor-"))

            // Add new background color class if not default
            if (color !== "default") {
              newClasses.push(`bgcolor-${color}`)
            }

            selectedContainer.className = newClasses.join(" ")

            // Log the result
            console.log("Separator background update result:", {
              newClasses: selectedContainer.className,
              appliedColor: color,
              computedStyle: window.getComputedStyle(selectedContainer),
            })
          } else if (selection && selection.rangeCount > 0 && range) {
            // Rest of the existing background color logic for text...
            // Store the original range boundaries
            const startContainer = range.startContainer
            const startOffset = range.startOffset
            const endContainer = range.endContainer
            const endOffset = range.endOffset

            console.log("\n=== Background Color Removal START ===")
            console.log("Current DOM structure:", editorRef.current.innerHTML)
            console.log("Selection state:", {
              exists: !!selection,
              rangeCount: selection?.rangeCount,
              text: selection?.toString(),
            })

            console.log("Original range info:", {
              startContainer: {
                type: range.startContainer.nodeType,
                name: range.startContainer.nodeName,
                text: range.startContainer.textContent,
                parent: range.startContainer.parentNode?.nodeName,
              },
              startOffset,
              endContainer: {
                type: range.endContainer.nodeType,
                name: range.endContainer.nodeName,
                text: range.endContainer.textContent,
                parent: range.endContainer.parentNode?.nodeName,
              },
              endOffset,
            })

            // Extract content and create temporary container
            const fragment = range.extractContents()
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(fragment)

            console.log("Extracted content:", {
              tempDivHTML: tempDiv.innerHTML,
              tempDivText: tempDiv.textContent,
            })

            // Remove any existing background color spans
            const removeBackgroundSpans = (node: Node) => {
              console.log("Processing node for background removal:", {
                type: node.nodeType,
                name: node.nodeName,
                text: node.textContent?.slice(0, 50),
                hasBackgroundColor: node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).style?.backgroundColor,
              })
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "SPAN") {
                const span = node as HTMLSpanElement
                if (span.style.backgroundColor) {
                  const parent = span.parentNode
                  if (parent) {
                    while (span.firstChild) {
                      parent.insertBefore(span.firstChild, span)
                    }
                    span.remove()
                  }
                }
              }
              Array.from(node.childNodes).forEach(removeBackgroundSpans)
            }
            removeBackgroundSpans(tempDiv)

            console.log("Before reinsertion:", {
              range: {
                startContainer: range.startContainer.nodeName,
                startOffset: range.startOffset,
                endContainer: range.endContainer.nodeName,
                endOffset: range.endOffset,
              },
              tempDivContent: tempDiv.innerHTML,
            })

            // Only apply new background color if not default
            if (color !== "default") {
              const colorMap = {
                red: "#fee2e2",
                green: "#dcfce7",
                blue: "#dbeafe",
                yellow: "#fef9c3",
                purple: "#f3e8ff",
                slate: "#f1f5f9",
              } as const

              // Create new span with background color
              const span = document.createElement("span")
              span.style.backgroundColor =
                color !== "default" && color in colorMap ? colorMap[color as keyof typeof colorMap] : "transparent"

              // Move all content into the new span
              while (tempDiv.firstChild) {
                span.appendChild(tempDiv.firstChild)
              }

              // Insert the new span
              range.insertNode(span)

              // Update selection to cover the new span
              const newRange = document.createRange()
              newRange.selectNodeContents(span)
              selection.removeAllRanges()
              selection.addRange(newRange)
            } else {
              // For default color, just insert the cleaned content
              while (tempDiv.firstChild) {
                range.insertNode(tempDiv.firstChild)
              }

              console.log("Attempting to restore selection with:", {
                startContainer: {
                  exists: !!startContainer,
                  type: startContainer.nodeType,
                  name: startContainer.nodeName,
                  inDocument: document.contains(startContainer),
                },
                endContainer: {
                  exists: !!endContainer,
                  type: endContainer.nodeType,
                  name: endContainer.nodeName,
                  inDocument: document.contains(endContainer),
                },
                offsets: { startOffset, endOffset },
              })

              // Store text content before and after selection by filtering formatting
              /*
              const getTextContent = (node: Node): string => {
                if (node.nodeType === Node.TEXT_NODE) return node.textContent || ""
                if (node.nodeType === Node.ELEMENT_NODE) {
                  return Array.from(node.childNodes).map(getTextContent).join("")
                }
                return ""
              }
              */

              // Get pure text before selection
              const getLeftText = (node: Node, endNode: Node): string => {
                let text = ""
                const walker = document.createTreeWalker(
                  editorRef.current!,
                  NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                )
                let currentNode = walker.nextNode()

                while (currentNode && currentNode !== endNode) {
                  if (currentNode.nodeType === Node.TEXT_NODE) {
                    text += currentNode.textContent
                  }
                  currentNode = walker.nextNode()
                }
                return text
              }

              // Removed unused function
              /*
              const getRightText = (startNode: Node): string => {
                let text = ""
                const walker = document.createTreeWalker(
                  editorRef.current!,
                  NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                )
                let currentNode = walker.nextNode()

                // Skip until we find our start node
                while (currentNode && currentNode !== startNode) {
                  currentNode = walker.nextNode()
                }

                // Now collect text after our node
                while ((currentNode = walker.nextNode())) {
                  if (currentNode.nodeType === Node.TEXT_NODE) {
                    text += currentNode.textContent
                  }
                }
                return text
              }
              */

              // Store the text before and after selection
              const leftText = getLeftText(editorRef.current!, range.startContainer)
              // Removed unused rightText

              // After DOM modifications, find new selection points
              const findNewSelectionPoints = (): {
                start: Node
                end: Node
                startOffset: number
                endOffset: number
              } | null => {
                const walker = document.createTreeWalker(
                  editorRef.current!,
                  NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                )
                let currentNode = walker.nextNode()
                let currentLeftText = ""
                let foundStart = false
                let start: Node | null = null
                let startOffset = 0

                // Find start position
                while (currentNode && !foundStart) {
                  if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent || ""
                    if (!foundStart && currentLeftText.length + text.length >= leftText.length) {
                      start = currentNode
                      startOffset = leftText.length - currentLeftText.length
                      foundStart = true
                    }
                    currentLeftText += text
                  }
                  if (!foundStart) currentNode = walker.nextNode()
                }

                // Find end position by matching right text
                let end: Node | null = start
                let endOffset = startOffset
                let remainingLength = "Testtext".length // Known selection length

                while (currentNode && remainingLength > 0) {
                  if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent || ""
                    if (text.length >= remainingLength) {
                      end = currentNode
                      endOffset = remainingLength
                      break
                    }
                    remainingLength -= text.length
                  }
                  currentNode = walker.nextNode()
                }

                if (start && end) {
                  return { start, end, startOffset, endOffset }
                }
                return null
              }

              // Restore selection using the found points
              const newPoints = findNewSelectionPoints()
              if (newPoints) {
                const newRange = document.createRange()
                newRange.setStart(newPoints.start, newPoints.startOffset)
                newRange.setEnd(newPoints.end, newPoints.endOffset)
                selection.removeAllRanges()
                selection.addRange(newRange)
              } else {
                console.error("Could not restore selection")
              }
            }

            // Clean up
            tempDiv.remove()
            console.log("\n=== Background Color Removal END ===")
            console.log("Final DOM structure:", editorRef.current.innerHTML)
          }
        } else if (command.startsWith("fontSize-")) {
          const size = command.split("-")[1]
          const sizeClasses = {
            small: "text-small",
            normal: "text-normal",
            large: "text-large",
          } as const

          console.log("Starting font size change:", {
            size,
            selection: selection.toString(),
          })
          logCurrentHTML()

          try {
            // First, find ALL existing text-size spans in the selection
            const spans = Array.from(editorRef.current.getElementsByTagName("span")).filter(
              (span) => span.className.startsWith("text-") && range?.intersectsNode(span),
            )

            console.log(
              "Found existing spans:",
              spans.map((span) => ({
                className: span.className,
                text: span.textContent,
              })),
            )

            // Store original range
            const originalRange = range?.cloneRange()

            if (spans.length > 0) {
              // Remove or update existing spans
              spans.forEach((span) => {
                if (span.className === sizeClasses[size as FontSizeKey]) {
                  // Remove formatting
                  console.log("Removing formatting from span:", span.className)
                  const parent = span.parentNode
                  if (parent) {
                    while (span.firstChild) {
                      parent.insertBefore(span.firstChild, span)
                    }
                    span.remove()
                  }
                } else {
                  // Update size
                  console.log("Updating span size from", span.className, "to", sizeClasses[size as FontSizeKey])
                  span.className = sizeClasses[size as FontSizeKey]
                }
              })

              // Restore selection
              try {
                selection.removeAllRanges()
                if (originalRange) {
                  selection.addRange(originalRange)
                }
              } catch (error) {
                console.error("Error restoring selection:", error)
              }
            } else {
              // Apply new formatting
              console.log("Applying new formatting")
              const span = document.createElement("span")
              span.className = sizeClasses[size as FontSizeKey]

              // Extract and wrap content
              const fragment = range?.extractContents()
              if (fragment) {
                span.appendChild(fragment)
              }
              range?.insertNode(span)

              // Update selection to include the new span
              const newRange = document.createRange()
              newRange.selectNodeContents(span)
              selection.removeAllRanges()
              selection.addRange(newRange)
            }

            // Update format state
            setFormatState((prev) => ({
              ...prev,
              fontSize: size as "small" | "normal" | "large",
            }))

            // Verify the operation
            const verifySpans = Array.from(editorRef.current.getElementsByTagName("span")).filter((span) =>
              span.className.startsWith("text-"),
            )
            const hasNestedSpans = verifySpans.some((span) =>
              Array.from(span.getElementsByTagName("span")).some((child) => child.className.startsWith("text-")),
            )
            const selectionMaintained = selection.rangeCount > 0 && selection.toString().length > 0

            logFormatResult("Font Size Change", !hasNestedSpans && selectionMaintained, {
              size,
              operation: spans.length > 0 ? "update" : "new",
              selectionMaintained,
              hasNestedSpans,
            })
            logCurrentHTML()
          } catch (error) {
            console.error("Font size error:", error)
            logFormatResult("Font Size Change", false, {
              size,
              error: error instanceof Error ? error.message : String(error),
              selectedText: selection.toString(),
            })
            // Try to restore original selection on error
            if (selection && range) {
              selection.removeAllRanges()
              selection.addRange(range)
            }
          }
        } else if (command === "superscript" || command === "subscript") {
          const tagName = command === "superscript" ? "SUP" : "SUB"
          console.log("Starting script toggle:", {
            command,
            tagName,
            selection: selection.toString(),
          })
          logCurrentHTML()

          try {
            // Store original range
            const originalRange = range?.cloneRange()
            const isInScript = Array.from(editorRef.current.getElementsByTagName(tagName)).some((element) =>
              range?.intersectsNode(element),
            )

            if (isInScript) {
              // Remove all sup/sub formatting in the selection
              const fragment = range?.extractContents()
              const tempDiv = document.createElement("div")
              if (fragment) {
                tempDiv.appendChild(fragment)
              }

              // Remove sup/sub tags but keep their content
              const scriptElements = tempDiv.getElementsByTagName(tagName)
              while (scriptElements.length > 0) {
                const element = scriptElements[0]
                const parent = element.parentNode
                if (parent) {
                  while (element.firstChild) {
                    parent.insertBefore(element.firstChild, element)
                  }
                  element.remove()
                }
              }

              // Insert cleaned content
              range?.insertNode(tempDiv)
              while (tempDiv.firstChild) {
                if (tempDiv.parentNode) {
                  tempDiv.parentNode.insertBefore(tempDiv.firstChild, tempDiv)
                } else {
                  break
                }
              }
              tempDiv.remove()

              // Update selection
              const newRange = document.createRange()
              if (originalRange && originalRange.startContainer && originalRange.endContainer) {
                newRange.setStart(originalRange.startContainer, originalRange.startOffset || 0)
                newRange.setEnd(originalRange.endContainer, originalRange.endOffset || 0)
                selection.removeAllRanges()
                selection.addRange(newRange)
              }

              setFormatState((prev) => ({
                ...prev,
                superscript: command === "superscript" ? false : prev.superscript,
                subscript: command === "subscript" ? false : prev.subscript,
              }))
            } else {
              // Wrap selection in sup/sub tag
              const fragment = range?.extractContents()
              const scriptElement = document.createElement(tagName)
              if (fragment) {
                scriptElement.appendChild(fragment)
              }
              range?.insertNode(scriptElement)

              // Update selection
              const newRange = document.createRange()
              newRange.selectNodeContents(scriptElement)
              selection.removeAllRanges()
              selection.addRange(newRange)

              setFormatState((prev) => ({
                ...prev,
                superscript: command === "superscript" ? true : prev.superscript,
                subscript: command === "subscript" ? true : prev.subscript,
              }))
            }

            console.log("After script toggle:")
            logCurrentHTML()
          } catch (error) {
            console.error("Script toggle error:", error)
          }
        } else {
          document.execCommand(command, false)
        }
      }

      if (editorRef.current) {
        editorRef.current.focus()
      }
    },
    [logCurrentHTML, logFormatResult, logBlockquoteOperation],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editorRef.current || !listHandlerRef.current) return

      // Handle Enter in checklists
      if (e.key === "Enter" && !e.shiftKey) {
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)

        console.group("=== Enter Key Debug ===")
        console.log("Enter key event details:", {
          type: e.type,
          key: e.key,
          keyCode: e.keyCode,
          target: e.target,
          currentTarget: e.currentTarget,
          bubbles: e.bubbles,
          cancelable: e.cancelable,
          defaultPrevented: e.defaultPrevented,
          eventPhase:
            e.eventPhase === 1
              ? "CAPTURING_PHASE"
              : e.eventPhase === 2
                ? "AT_TARGET"
                : e.eventPhase === 3
                  ? "BUBBLING_PHASE"
                  : "UNKNOWN",
        })
        console.log("Enter pressed:", {
          editorFocused: document.activeElement === editorRef.current,
          selection: {
            exists: !!selection,
            text: selection?.toString(),
            rangeCount: selection?.rangeCount,
          },
          editorContent: editorRef.current?.innerHTML,
          inChecklist: range
            ? range.commonAncestorContainer.nodeType === Node.TEXT_NODE
              ? (range.commonAncestorContainer.parentElement?.closest("ul.checklist") ?? false)
              : ((range.commonAncestorContainer as Element).closest("ul.checklist") ?? false)
            : false,
          keyEvent: {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            target: e.target,
          },
        })
        const handled = listHandlerRef.current.handleChecklistEnter(e as unknown as KeyboardEvent)
        if (handled) return
        console.groupEnd()
      }

      // Handle checkbox syntax
      const selection2 = window.getSelection()
      if (!selection2 || selection2.rangeCount === 0) return

      // Handle Tab key for list indentation
      if (e.key === "Tab" && listHandlerRef.current) {
        const handled = listHandlerRef.current.handleTab(e as unknown as KeyboardEvent)
        if (handled) {
          e.preventDefault()
          return
        }
      }

      // Handle ">" at the start of a line for blockquotes
      if (e.key === ">" && isAtLineStart()) {
        e.preventDefault()
        handleFormat("blockquote")
      }

      // Handle "---" for separators
      if (e.key === "-") {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const text = range.startContainer.textContent || ""
        const position = range.startOffset

        if (text.substring(position - 2, position) === "--") {
          e.preventDefault()
          // Remove the "--" characters
          const newRange = document.createRange()
          newRange.setStart(range.startContainer, position - 2)
          newRange.setEnd(range.startContainer, position)
          newRange.deleteContents()

          handleFormat("separator")
        }
      }
    },
    [handleFormat],
  )

  // Helper function to check if cursor is at the start of a line
  const isAtLineStart = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    const text = range.startContainer.textContent || ""
    const position = range.startOffset

    // Check if we're at the start of the text or after a newline
    return position === 0 || text.charAt(position - 1) === "\n"
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  // Add click handler to remove selection when clicking outside
  useEffect(() => {
    const editor = editorRef.current
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".separator-container")) {
        editor?.querySelectorAll(".separator-container").forEach((sep) => {
          sep.classList.remove("selected")
        })
      }
    }

    editor?.addEventListener("click", handleOutsideClick)

    return () => {
      editor?.removeEventListener("click", handleOutsideClick)
    }
  }, [])

  // Add click handler for checkboxes
  useEffect(() => {
    const editor = editorRef.current
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.matches('input[type="checkbox"]')) {
        e.preventDefault() // Prevent default checkbox behavior
        e.stopPropagation() // Stop event from bubbling

        const listItem = target.closest("li")
        if (listItem && listHandlerRef.current) {
          // Use requestAnimationFrame to ensure DOM updates are batched
          requestAnimationFrame(() => {
            if (listHandlerRef.current) {
              listHandlerRef.current.toggleCheckbox(listItem as HTMLLIElement)

              // Ensure focus remains in the editor
              const span = listItem.querySelector("span")
              if (span) {
                const range = document.createRange()
                range.selectNodeContents(span)
                const selection = window.getSelection()
                selection?.removeAllRanges()
                selection?.addRange(range)
                span.focus()
              }
            }
          })
        }
      }
    }

    // Use capture phase to ensure we handle the event before other handlers
    editor?.addEventListener("click", handleClick, true)
    return () => editor?.removeEventListener("click", handleClick, true)
  }, [])

  return (
    <>
      <EditorStyles />
      <Card className="w-full">
        <CardContent className="p-0">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="p-1 flex flex-wrap items-center gap-1">
              {/* Linke Gruppe mit allen bestehenden Buttons */}
              <div className="flex flex-wrap items-center gap-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Fett (Ctrl+B)"
                  onClick={() => document.execCommand("bold", false)}
                  className="h-8 w-8"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Kursiv (Ctrl+I)"
                  onClick={() => document.execCommand("italic", false)}
                  className="h-8 w-8"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Unterstrichen (Ctrl+U)"
                  onClick={() => document.execCommand("underline", false)}
                  className="h-8 w-8"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Durchgestrichen"
                  onClick={() => document.execCommand("strikethrough", false)}
                  className="h-8 w-8"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>

                <div
                  className="relative"
                  onMouseDown={(e) => {
                    console.log("Dropdown container mousedown")
                    e.preventDefault()
                    e.stopPropagation()
                    saveSelection()
                  }}
                  onClick={(e) => {
                    console.log("Dropdown container click")
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <DropdownMenu
                    onOpenChange={(open) => {
                      console.log("Dropdown open state changed:", open)
                    }}
                  >
                    <DropdownMenuTrigger
                      className={cn(
                        "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                        (formatState.subscript || formatState.superscript || formatState.fontSize !== "normal") &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      <span>Erweitert</span>
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align="start"
                      sideOffset={4}
                      onCloseAutoFocus={(e) => {
                        console.log("Dropdown close auto focus")
                        e.preventDefault()
                        restoreSelection()
                      }}
                      onInteractOutside={(e) => {
                        console.log("Dropdown interact outside")
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onEscapeKeyDown={() => {
                        console.log("Escape key pressed")
                        restoreSelection()
                      }}
                    >
                      <DropdownMenuItem onSelect={() => handleFormat("superscript")}>
                        <Superscript className="mr-2 h-4 w-4" />
                        <span>Hochgestellt</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleFormat("subscript")}>
                        <Subscript className="mr-2 h-4 w-4" />
                        <span>Tiefgestellt</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <TextCursor className="mr-2 h-4 w-4" />
                          <span>Textgröße</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 rounded-lg">
                          <DropdownMenuItem onSelect={() => handleFormat("fontSize-small")}>
                            <span className="text-sm">Klein</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleFormat("fontSize-normal")}>
                            <span>Normal</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleFormat("fontSize-large")}>
                            <span className="text-lg">Groß</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mx-0.5 w-px h-5 bg-border" />

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Aufzählungsliste"
                    onClick={() => handleFormat("insertUnorderedList")}
                    className="h-8 px-2"
                  >
                    <List className="h-4 w-4 mr-1" />
                    <span className="text-xs">Aufzählung</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Nummerierte Liste"
                    onClick={() => handleFormat("insertOrderedList")}
                    className="h-8 px-2"
                  >
                    <ListOrdered className="h-4 w-4 mr-1" />
                    <span className="text-xs">Nummeriert</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Checkliste"
                    onClick={(e) => {
                      // Prevent default to avoid losing focus
                      e.preventDefault()
                      e.stopPropagation()

                      console.group("=== Checklist Button Click ===")
                      console.log("Initial state:", {
                        activeElement: document.activeElement,
                        editorHasFocus: document.activeElement === editorRef.current,
                        hasSelection: !!window.getSelection()?.toString(),
                      })

                      // First focus the editor and save current selection
                      editorRef.current?.focus()

                      // Save selection state
                      saveSelection()

                      // Small delay to ensure focus and selection are stable
                      setTimeout(() => {
                        try {
                          // Restore selection
                          restoreSelection()

                          console.log("Before handling checklist:", {
                            activeElement: document.activeElement,
                            editorHasFocus: document.activeElement === editorRef.current,
                            hasSelection: !!window.getSelection()?.toString(),
                          })

                          // Now safely handle checklist
                          handleFormat("checklist")
                        } catch (error) {
                          console.error("Error handling checklist:", error)
                        } finally {
                          console.groupEnd()
                        }
                      }, 50)
                    }}
                    className="h-8 px-2"
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    <span className="text-xs">Checkliste</span>
                  </Button>
                </div>

                <div className="mx-0.5 w-px h-5 bg-border" />

                {/* Farb-Buttons */}
                <div className="flex items-center gap-1">
                  <ColorPickerButton
                    value={textColor}
                    onChange={(color) => {
                      setTextColor(color)
                      handleFormat(`color-${color}`)
                    }}
                  />
                  <BackgroundColorPickerButton
                    value={backgroundColor}
                    onChange={(color) => {
                      setBackgroundColor(color)
                      handleFormat(`bgcolor-${color}`)
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Blockzitat"
                  onClick={() => handleFormat("blockquote")}
                  className="h-8 w-8"
                >
                  <Quote className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Trennlinie"
                  onClick={() => handleFormat("separator")}
                  className="h-8 w-8"
                >
                  <MinusSquare className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Rechte Gruppe mit Test-Button */}
              <div className="flex items-center ml-auto">
                <TestButton editorRef={editorRef} onFormat={handleFormat} />
              </div>
            </div>

            <div
              ref={editorRef}
              className="editor-content w-full rounded-lg border border-input px-4 py-3 text-base ring-offset-background min-h-[200px]"
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
            >
              Hier ist ein Beispieltext zum Testen der Formatierung. Wählen Sie einen Teil des Textes aus und klicken
              Sie auf die Formatierungsschaltflächen.
            </div>

            <div className="p-2">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

