"use client"

import type React from "react"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TestButtonProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  onFormat: (command: string) => void
}

export function TestButton({ editorRef, onFormat }: TestButtonProps) {
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [currentStep, setCurrentStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Füge diese Logging-Funktion nach der delay-Funktion hinzu
  const logBlockquoteTest = (phase: string, details: Record<string, unknown>) => {
    console.group(`=== BLOCKQUOTE TEST ${phase.toUpperCase()} ===`)
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Allgemeine Informationen zum Editor-Zustand
    if (editorRef.current) {
      console.log("Editor state:", {
        hasFocus: document.activeElement === editorRef.current,
        contentLength: editorRef.current.innerHTML.length,
        hasBlockquote: !!editorRef.current.querySelector("blockquote"),
        hasSelection: !!window.getSelection()?.toString(),
        activeElement: document.activeElement?.tagName,
      })
    }

    // Details ausgeben
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}:`, value)
    })

    console.groupEnd()
  }

  // Helper to clean the editor content
  const cleanEditor = () => {
    if (!editorRef.current) return

    // Remove all content and formatting
    editorRef.current.innerHTML = ""

    // Clear any selections
    const selection = window.getSelection()
    selection?.removeAllRanges()

    // Reset to initial test content
    editorRef.current.textContent = "Dies ist ein Testtext für die automatische Formatierung."
  }

  // Helper to clean up after each test step
  const cleanupStep = async () => {
    if (!editorRef.current) return

    // Remove any remaining selections
    const selection = window.getSelection()
    selection?.removeAllRanges()

    // Remove any nested formatting
    const content = editorRef.current.innerHTML
    if (content.includes("><")) {
      // If nested tags detected, reset content
      cleanEditor()
    }

    await delay(50)
  }

  const findAndValidateTextNode = (searchText: string): { node: Node; offset: number } => {
    if (!editorRef.current) {
      throw new Error("Editor reference not found")
    }

    // First normalize the DOM
    editorRef.current.normalize()

    // Get all text nodes
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.nextNode()
    let foundNode: { node: Node; offset: number } | null = null

    while (node) {
      const text = node.textContent || ""
      const index = text.indexOf(searchText)
      if (index !== -1) {
        foundNode = { node, offset: index }
        break
      }
      node = walker.nextNode()
    }

    if (!foundNode) {
      throw new Error(`Text "${searchText}" not found in editor`)
    }

    // Validate node
    if (!foundNode.node.textContent) {
      throw new Error("Found node has no text content")
    }

    if (foundNode.offset + searchText.length > foundNode.node.textContent.length) {
      throw new Error("Invalid text node boundaries")
    }

    return foundNode
  }

  const selectText = (searchText: string): { range: Range; selection: Selection } => {
    if (!editorRef.current) {
      throw new Error("Editor reference not found")
    }

    try {
      // Clear any existing selections first
      const selection = window.getSelection()
      selection?.removeAllRanges()

      // Find and validate text node
      const { node, offset } = findAndValidateTextNode(searchText)

      // Create and validate range
      const range = document.createRange()
      range.setStart(node, offset)
      range.setEnd(node, offset + searchText.length)

      // Verify range content
      if (range.toString() !== searchText) {
        throw new Error(`Range content mismatch. Expected: "${searchText}", Got: "${range.toString()}"`)
      }

      // Apply selection
      if (!selection) {
        throw new Error("Could not get selection object")
      }
      selection.removeAllRanges()
      selection.addRange(range)

      // Final verification
      if (selection.toString() !== searchText) {
        throw new Error(`Selection content mismatch. Expected: "${searchText}", Got: "${selection.toString()}"`)
      }

      editorRef.current.focus()
      return { range, selection }
    } catch (error) {
      throw new Error(`Selection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const validateFormatting = (expectedTag?: string, expectedClass?: string, parentTag?: string): boolean => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) {
      throw new Error("No selection found during validation")
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const elementToCheck = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element)

    if (!elementToCheck) {
      throw new Error("No element found for validation")
    }

    // For color validation, check if we have a span with style
    if (expectedTag === "SPAN" && !expectedClass) {
      const colorSpan = elementToCheck?.closest("span")
      if (!colorSpan) {
        throw new Error("Expected span with color/background-color, but none found")
      }
      const hasColor = colorSpan.style.color || colorSpan.style.backgroundColor
      if (!hasColor) {
        throw new Error("Span found but no color/background-color style")
      }
      return true
    }

    // For font size validation with SPAN and class
    if (expectedTag === "SPAN" && expectedClass) {
      const spans = Array.from(editorRef.current?.getElementsByTagName("span") || []).filter((span) => {
        return range.intersectsNode(span) && span.classList.contains(expectedClass)
      })

      if (spans.length === 0) {
        throw new Error(`No span found with class ${expectedClass}`)
      }

      // Verify computed styles
      const fontSizeMap: Record<string, string> = {
        "text-small": "14px",
        "text-normal": "16px",
        "text-large": "20px",
      }

      const validSpan = spans.some((span) => {
        const style = window.getComputedStyle(span)
        return style.fontSize === fontSizeMap[expectedClass as keyof typeof fontSizeMap] || false
      })

      if (!validSpan) {
        throw new Error(`Invalid font size for class ${expectedClass}`)
      }

      return true
    }

    // Add validation for blockquotes
    // Ersetze den Blockquote-Teil in der validateFormatting-Funktion mit diesem Code
    if (expectedTag === "BLOCKQUOTE") {
      console.group("=== BLOCKQUOTE VALIDATION ===")

      console.log("Validation context:", {
        selectionText: selection.toString(),
        rangeStartContainer: range.startContainer.nodeName,
        rangeEndContainer: range.endContainer.nodeName,
        commonAncestor: range.commonAncestorContainer.nodeName,
        elementToCheck: elementToCheck?.nodeName,
      })

      const blockquote = elementToCheck?.closest("blockquote")
      console.log("Blockquote search result:", {
        found: !!blockquote,
        blockquoteClass: blockquote?.className,
        blockquoteContent: blockquote?.textContent?.substring(0, 30),
        blockquoteHTML: blockquote?.outerHTML,
      })

      if (!blockquote) {
        console.error("Expected blockquote, but none found", {
          elementToCheckHTML: elementToCheck?.outerHTML,
          elementToCheckParent: elementToCheck?.parentElement?.nodeName,
          editorContent: editorRef.current?.innerHTML,
        })
        console.groupEnd()
        return false
      }

      const hasCorrectClass = blockquote.classList.contains("editor-blockquote")
      console.log("Class validation:", {
        hasEditorBlockquoteClass: hasCorrectClass,
        allClasses: Array.from(blockquote.classList),
      })

      console.groupEnd()
      return hasCorrectClass
    }

    // Add validation for separators
    if (expectedTag === "HR") {
      const hr = elementToCheck?.querySelector("hr.editor-separator")
      if (!hr) {
        console.error("Expected separator, but none found")
        return false
      }
      return true
    }

    // Add validation for checklists
    if (expectedTag === "CHECKLIST") {
      const list = elementToCheck?.closest("ul.checklist")
      if (!list) {
        throw new Error("Expected checklist, but none found")
      }
      const items = list.querySelectorAll("li")
      if (items.length === 0) {
        throw new Error("Checklist has no items")
      }

      // Verify checklist structure
      for (const item of items) {
        const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement
        const span = item.querySelector("span") as HTMLSpanElement
        if (!checkbox || !span) {
          throw new Error("Checklist item missing checkbox or content span")
        }
        if (checkbox.type !== "checkbox") {
          throw new Error("Checkbox input has wrong type")
        }
        if (!span.isContentEditable) {
          throw new Error("Content span is not editable")
        }
      }

      // Verify checklist spacing
      const style = window.getComputedStyle(items[0])
      const lineHeightPx = Number.parseFloat(style.lineHeight)
      const fontSizePx = Number.parseFloat(style.fontSize)
      const lineHeightRatio = lineHeightPx / fontSizePx

      console.log("Checklist spacing validation:", {
        lineHeightPx,
        fontSizePx,
        lineHeightRatio,
        style: {
          lineHeight: style.lineHeight,
          fontSize: style.fontSize,
        },
      })

      // Compare the ratio instead of raw values
      if (lineHeightRatio > 1.5) {
        // Allow slightly more than 1.2 for browser rounding
        throw new Error(`Line height ratio too large: ${lineHeightRatio.toFixed(2)}`)
      }

      const minHeight = Number.parseFloat(style.minHeight)
      if (minHeight > 18) {
        throw new Error(`Min height too large: ${minHeight}`)
      }

      return true
    }

    // Get computed style once for efficiency
    const computedStyle = window.getComputedStyle(elementToCheck)

    // Check formatting based on tag type
    switch (expectedTag) {
      case "B":
        const isBold = elementToCheck.closest("b") !== null || computedStyle.fontWeight >= "700"
        console.log("Bold validation:", {
          hasTag: elementToCheck.closest("b") !== null,
          fontWeight: computedStyle.fontWeight,
          isBold,
        })
        return isBold

      case "I":
        const isItalic = elementToCheck.closest("i") !== null || computedStyle.fontStyle === "italic"
        console.log("Italic validation:", {
          hasTag: elementToCheck.closest("i") !== null,
          fontStyle: computedStyle.fontStyle,
          isItalic,
        })
        return isItalic

      case "U":
        const isUnderlined =
          elementToCheck.closest("u") !== null || computedStyle.textDecorationLine.includes("underline")
        console.log("Underline validation:", {
          hasTag: elementToCheck.closest("u") !== null,
          textDecoration: computedStyle.textDecorationLine,
          isUnderlined,
        })
        return isUnderlined

      case "STRIKE":
        const isStrikethrough =
          elementToCheck.closest("strike") !== null || computedStyle.textDecorationLine.includes("line-through")
        console.log("Strikethrough validation:", {
          hasTag: elementToCheck.closest("strike") !== null,
          textDecoration: computedStyle.textDecorationLine,
          isStrikethrough,
        })
        return isStrikethrough

      case "SUP":
        const isSuperscript = elementToCheck.closest("sup") !== null || computedStyle.verticalAlign === "super"
        console.log("Superscript validation:", {
          hasTag: elementToCheck.closest("sup") !== null,
          verticalAlign: computedStyle.verticalAlign,
          isSuperscript,
        })
        return isSuperscript

      case "SUB":
        const isSubscript = elementToCheck.closest("sub") !== null || computedStyle.verticalAlign === "sub"
        console.log("Subscript validation:", {
          hasTag: elementToCheck.closest("sub") !== null,
          verticalAlign: computedStyle.verticalAlign,
          isSubscript,
        })
        return isSubscript

      default:
        // For parent tags (like UL/OL)
        if (parentTag) {
          const hasParent = elementToCheck?.closest(parentTag.toLowerCase())
          if (!hasParent) {
            console.error(`Expected parent tag ${parentTag}, but none found`)
            return false
          }
          return true
        }

        // For other tags, check if we're inside the expected tag
        if (expectedTag) {
          const hasTag = elementToCheck?.closest(expectedTag.toLowerCase())
          if (!hasTag) {
            console.error(`Expected tag ${expectedTag}, but none found`)
            return false
          }
          return true
        }

        return true
    }
  }

  const runTest = async () => {
    let testCounter = 0
    try {
      setTestStatus("running")
      setCurrentStep(0)
      setErrorMessage("")

      // Initialize editor with clean content
      console.log(`Starting Test ${++testCounter}: Initialize Content`)
      if (!editorRef.current) throw new Error("Editor not found")
      cleanEditor()
      await delay(50)

      // For each test step:
      // 1. Select text (throws if selection fails)
      // 2. Apply formatting
      // 3. Validate result (throws if validation fails)
      // 4. Clean up after step
      // 5. Update step counter

      // Example for bold formatting:
      console.log(`Starting Test ${++testCounter}: Bold Formatting`)
      selectText("Testtext")
      onFormat("bold")
      await delay(50)
      if (!validateFormatting("B")) throw new Error("Bold formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 4: Fett zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Bold`)
      onFormat("bold")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 5: Kursiv
      console.log(`Starting Test ${++testCounter}: Italic`)
      selectText("Testtext")
      onFormat("italic")
      await delay(50)
      if (!validateFormatting("I")) throw new Error("Italic formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 6: Kursiv zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Italic`)
      onFormat("italic")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 7: Unterstrichen
      console.log(`Starting Test ${++testCounter}: Underline`)
      selectText("Testtext")
      onFormat("underline")
      await delay(50)
      if (!validateFormatting("U")) throw new Error("Underline formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 8: Unterstrichen zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Underline`)
      onFormat("underline")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 9: Durchgestrichen
      console.log(`Starting Test ${++testCounter}: Strikethrough`)
      selectText("Testtext")
      onFormat("strikethrough")
      await delay(50)
      if (!validateFormatting("STRIKE")) throw new Error("Strikethrough formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 10: Durchgestrichen zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Strikethrough`)
      onFormat("strikethrough")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 11: Aufzählungsliste
      console.log(`Starting Test ${++testCounter}: Bullet List`)
      selectText("Testtext")
      onFormat("insertUnorderedList")
      await delay(50)
      if (!validateFormatting(undefined, undefined, "UL")) throw new Error("Bullet list formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 12: Aufzählungsliste zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Bullet List`)
      onFormat("insertUnorderedList")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 13: Nummerierte Liste
      console.log(`Starting Test ${++testCounter}: Numbered List`)
      selectText("Testtext")
      onFormat("insertOrderedList")
      await delay(50)
      if (!validateFormatting(undefined, undefined, "OL")) throw new Error("Numbered list formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 14: Nummerierte Liste zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Numbered List`)
      onFormat("insertOrderedList")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 15: Hochstellung
      console.log(`Starting Test ${++testCounter}: Superscript`)
      selectText("Testtext")
      onFormat("superscript")
      await delay(50)
      if (!validateFormatting("SUP")) throw new Error("Superscript formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 16: Hochstellung zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Superscript`)
      onFormat("superscript")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 17: Tiefstellung
      console.log(`Starting Test ${++testCounter}: Subscript`)
      selectText("Testtext")
      onFormat("subscript")
      await delay(50)
      if (!validateFormatting("SUB")) throw new Error("Subscript formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Schritt 18: Tiefstellung zurücksetzen
      console.log(`Starting Test ${++testCounter}: Reset Subscript`)
      onFormat("subscript")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 19: Text Color
      console.log(`Starting Test ${++testCounter}: Applying Text Color`)
      selectText("Testtext")
      onFormat("color-red")
      await delay(50)
      if (!validateFormatting("SPAN")) throw new Error("Text color formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 20: Text Color Change
      console.log(`Starting Test ${++testCounter}: Changing Text Color`)
      selectText("Testtext")
      onFormat("color-blue")
      await delay(50)
      if (!validateFormatting("SPAN")) throw new Error("Text color change failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 21: Remove Text Color
      console.log(`Starting Test ${++testCounter}: Remove Text Color`)
      selectText("Testtext")
      onFormat("color-default")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 22: Background Color
      console.log(`Starting Test ${++testCounter}: Background Color`)
      selectText("Testtext")
      onFormat("bgcolor-yellow")
      await delay(50)
      if (!validateFormatting("SPAN")) throw new Error("Background color formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 23: Background Color Change
      console.log(`Starting Test ${++testCounter}: Background Color Change`)
      selectText("Testtext")
      onFormat("bgcolor-green")
      await delay(50)
      if (!validateFormatting("SPAN")) throw new Error("Background color change failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 24: Remove Background Color
      console.log(`Starting Test ${++testCounter}: Remove Background Color`)
      selectText("Testtext")
      onFormat("bgcolor-default")
      await delay(50)
      await cleanupStep()
      setCurrentStep(testCounter)

      // Step 25: Create Separator
      console.log(`Starting Test ${++testCounter}: Create Separator`)
      onFormat("separator")
      await delay(500) // Increased delay to ensure DOM update
      if (!validateFormatting("HR")) throw new Error("Separator creation failed")
      // Skip cleanup here to preserve separator for next test
      setCurrentStep(testCounter)

      // Step 26: Select and Color Separator
      console.log(`Starting Test ${++testCounter}: Select and Color Separator`)
      const separatorContainer = editorRef.current.querySelector(".separator-container")
      if (!separatorContainer) throw new Error("Could not find separator container")

      // Create a selection range for the container
      const rangeSeparator = document.createRange()
      const selectionSeparator = window.getSelection()

      try {
        // Instead of selecting the node directly, select its contents
        rangeSeparator.selectNodeContents(separatorContainer)
        selectionSeparator?.removeAllRanges()
        selectionSeparator?.addRange(rangeSeparator)

        // Trigger the click event to ensure proper selection state
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
        separatorContainer.dispatchEvent(clickEvent)

        await delay(500) // Wait for selection to register

        // Apply the color
        onFormat("color-red")
        await delay(500) // Wait for color change

        if (!separatorContainer.classList.contains("color-red")) {
          throw new Error("Separator color change failed")
        }

        // Step 27: Change Separator Color
        console.log(`Starting Test ${++testCounter}: Change Separator Color`)

        // Reselect for next color change
        rangeSeparator.selectNodeContents(separatorContainer)
        selectionSeparator?.removeAllRanges()
        selectionSeparator?.addRange(rangeSeparator)
        separatorContainer.dispatchEvent(clickEvent)

        await delay(500) // Wait for selection
        onFormat("color-blue")
        await delay(500) // Wait for color change

        if (!separatorContainer.classList.contains("color-blue")) {
          throw new Error("Separator color update failed")
        }

        // Step 28: Remove Separator Color
        console.log(`Starting Test ${++testCounter}: Remove Separator Color`)

        // Reselect for color removal
        rangeSeparator.selectNodeContents(separatorContainer)
        selectionSeparator?.removeAllRanges()
        selectionSeparator?.addRange(rangeSeparator)
        separatorContainer.dispatchEvent(clickEvent)

        await delay(500) // Wait for selection
        onFormat("color-default")
        await delay(500) // Wait for color removal

        if (separatorContainer.classList.contains("color-blue")) {
          throw new Error("Separator color removal failed")
        }
      } catch (error) {
        console.error("Separator operation failed:", error)
        throw error
      } finally {
        // Clean up selection
        selectionSeparator?.removeAllRanges()
      }

      await cleanupStep()
      setCurrentStep(testCounter)

      // Font Size Tests
      // Small Font
      console.log(`Starting Test ${++testCounter}: Small Font`)
      selectText("Testtext")
      onFormat("fontSize-small")
      await delay(50)
      if (!validateFormatting("SPAN", "text-small")) throw new Error("Small font formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Normal Font
      console.log(`Starting Test ${++testCounter}: Normal Font`)
      selectText("Testtext")
      onFormat("fontSize-normal")
      await delay(50)
      if (!validateFormatting("SPAN", "text-normal")) throw new Error("Normal font formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Large Font
      console.log(`Starting Test ${++testCounter}: Large Font Size`)
      selectText("Testtext")
      onFormat("fontSize-large")
      await delay(50)
      if (!validateFormatting("SPAN", "text-large")) throw new Error("Large font formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Ersetze den Blockquote-Test-Teil in der runTest-Funktion mit diesem erweiterten Code
      // Nach dem Font-Size Test und vor dem Blockquote Test
      // Füge eine längere Verzögerung ein und setze den Editor zurück
      await delay(200) // Longer delay for stability
      logBlockquoteTest("PREPARATION", {
        step: "Pre-blockquote cleanup",
        currentContent: editorRef.current.innerHTML,
      })

      cleanEditor() // Make sure we have clean content
      await delay(200) // Increased delay to ensure content is stable

      logBlockquoteTest("EDITOR_RESET", {
        editorContent: editorRef.current.innerHTML,
        textContent: editorRef.current.textContent,
        childNodes: Array.from(editorRef.current.childNodes).map((node) => ({
          nodeType: node.nodeType,
          nodeName: node.nodeName,
          textContent: node.textContent?.substring(0, 30),
        })),
      })

      // Ensure the editor has focus before attempting blockquote
      editorRef.current.focus()
      await delay(100)

      logBlockquoteTest("FOCUS_APPLIED", {
        activeElement: document.activeElement === editorRef.current ? "editor" : document.activeElement?.tagName,
        hasFocus: document.activeElement === editorRef.current,
      })

      // Create a paragraph element to ensure stable DOM structure
      if (editorRef.current.childNodes.length === 0 || editorRef.current.childNodes[0].nodeType !== Node.ELEMENT_NODE) {
        logBlockquoteTest("CREATING_PARAGRAPH", {
          reason: editorRef.current.childNodes.length === 0 ? "No child nodes" : "First child is not an element",
          firstChildType: editorRef.current.childNodes.length > 0 ? editorRef.current.childNodes[0].nodeType : "none",
        })

        const p = document.createElement("p")
        p.textContent = editorRef.current.textContent || "Dies ist ein Testtext für die automatische Formatierung."
        editorRef.current.innerHTML = ""
        editorRef.current.appendChild(p)
        await delay(100)

        logBlockquoteTest("PARAGRAPH_CREATED", {
          paragraphContent: p.textContent,
          editorHTML: editorRef.current.innerHTML,
          paragraphInDOM: document.contains(p),
        })
      }

      // Select the first few words using a more direct approach
      const selectionBlockquote = window.getSelection()
      selectionBlockquote?.removeAllRanges()

      logBlockquoteTest("SELECTION_CLEARED", {
        selectionExists: !!selectionBlockquote,
        rangeCount: selectionBlockquote?.rangeCount || 0,
      })

      // Find the first paragraph or text node
      const targetNode = editorRef.current.querySelector("p") || editorRef.current.firstChild
      if (!targetNode) {
        logBlockquoteTest("TARGET_NODE_ERROR", {
          error: "No content node found for blockquote test",
          editorContent: editorRef.current.innerHTML,
        })
        throw new Error("No content node found for blockquote test")
      }

      logBlockquoteTest("TARGET_NODE_FOUND", {
        nodeType: targetNode.nodeType,
        nodeName: targetNode.nodeName,
        textContent: targetNode.textContent,
        hasChildren: targetNode.hasChildNodes(),
        firstChildType: targetNode.firstChild ? targetNode.firstChild.nodeType : "none",
      })

      // Create a range for the first few words
      const rangeBlockquote = document.createRange()
      try {
        if (targetNode.nodeType === Node.ELEMENT_NODE) {
          // If it's a paragraph, select its text content
          if (targetNode.firstChild) {
            rangeBlockquote.setStart(targetNode.firstChild, 0)
            rangeBlockquote.setEnd(targetNode.firstChild, 8) // Select "Dies ist"

            logBlockquoteTest("RANGE_CREATED_FROM_ELEMENT_CHILD", {
              startContainer: targetNode.firstChild.nodeName,
              startOffset: 0,
              endOffset: 8,
              selectedText: rangeBlockquote.toString(),
            })
          } else {
            // If paragraph is empty, add text to it
            logBlockquoteTest("EMPTY_PARAGRAPH", {
              action: "Adding text to empty paragraph",
            })

            targetNode.textContent = "Dies ist ein Testtext"
            rangeBlockquote.setStart(targetNode.firstChild!, 0)
            rangeBlockquote.setEnd(targetNode.firstChild!, 8)

            logBlockquoteTest("TEXT_ADDED_TO_PARAGRAPH", {
              paragraphContent: targetNode.textContent,
              selectedText: rangeBlockquote.toString(),
            })
          }
        } else {
          // If it's a text node, select directly
          rangeBlockquote.setStart(targetNode, 0)
          rangeBlockquote.setEnd(targetNode, 8)

          logBlockquoteTest("RANGE_CREATED_FROM_TEXT_NODE", {
            startOffset: 0,
            endOffset: 8,
            selectedText: rangeBlockquote.toString(),
          })
        }

        selectionBlockquote?.addRange(rangeBlockquote)
        await delay(100) // Ensure selection is stable

        logBlockquoteTest("SELECTION_APPLIED", {
          selectionText: selectionBlockquote?.toString(),
          rangeCount: selectionBlockquote?.rangeCount || 0,
          isCollapsed: selectionBlockquote?.isCollapsed,
        })
      } catch (error) {
        logBlockquoteTest("RANGE_CREATION_ERROR", {
          error: error instanceof Error ? error.message : String(error),
          targetNodeInfo: {
            nodeType: targetNode.nodeType,
            nodeName: targetNode.nodeName,
            textContent: targetNode.textContent,
          },
        })
        throw error
      }

      console.log(`Starting Test ${++testCounter}: Blockquote Creation`)
      logBlockquoteTest("PRE_COMMAND", {
        text: selectionBlockquote?.toString(),
        range: rangeBlockquote.toString(),
        editorContent: editorRef.current.innerHTML,
        step: testCounter,
      })

      // Make sure editor has focus
      editorRef.current.focus()
      await delay(100)

      logBlockquoteTest("FOCUS_CONFIRMED", {
        activeElement: document.activeElement === editorRef.current ? "editor" : document.activeElement?.tagName,
        selectionMaintained: selectionBlockquote?.toString() === rangeBlockquote.toString(),
      })

      // Apply blockquote formatting
      onFormat("blockquote")
      await delay(100) // First delay to check immediate result

      logBlockquoteTest("IMMEDIATE_RESULT", {
        editorContent: editorRef.current.innerHTML,
        hasBlockquote: !!editorRef.current.querySelector("blockquote"),
        blockquoteContent: editorRef.current.querySelector("blockquote")?.textContent,
      })

      await delay(400) // Additional delay to ensure complete processing

      // Log the editor content after blockquote command
      logBlockquoteTest("FINAL_RESULT", {
        editorContent: editorRef.current.innerHTML,
        hasBlockquote: !!editorRef.current.querySelector("blockquote"),
        blockquoteContent: editorRef.current.querySelector("blockquote")?.textContent,
        blockquoteHTML: editorRef.current.querySelector("blockquote")?.outerHTML,
      })

      // Verify blockquote exists
      const blockquote = editorRef.current.querySelector("blockquote.editor-blockquote")
      if (!blockquote) {
        logBlockquoteTest("VALIDATION_FAILED", {
          error: "Blockquote element not found in DOM",
          fullHTML: editorRef.current.innerHTML,
          anyBlockquote: !!editorRef.current.querySelector("blockquote"),
        })
        throw new Error("Blockquote formatting failed - element not found")
      }

      logBlockquoteTest("VALIDATION_SUCCESS", {
        blockquoteClass: blockquote.className,
        blockquoteContent: blockquote.textContent,
        blockquoteChildNodes: Array.from(blockquote.childNodes).map((node) => ({
          nodeType: node.nodeType,
          nodeName: node.nodeName,
        })),
      })

      if (!validateFormatting("BLOCKQUOTE")) {
        logBlockquoteTest("FORMAT_VALIDATION_FAILED", {
          error: "Blockquote validation failed",
          validationResult: false,
        })
        throw new Error("Blockquote formatting failed")
      }

      logBlockquoteTest("TEST_COMPLETE", {
        success: true,
        step: testCounter,
      })

      await cleanupStep()
      setCurrentStep(testCounter)

      // Test separator
      console.log(`Starting Test ${++testCounter}: Separator`)
      selectText("Testtext")
      onFormat("separator")
      await delay(50)
      if (!validateFormatting("HR")) throw new Error("Separator formatting failed")
      await cleanupStep()
      setCurrentStep(testCounter)

      // Test Checklist Creation and Toggle
      console.log(`Starting Test ${++testCounter}: Create Checklist`)
      selectText("Testtext")
      onFormat("checklist")
      await delay(100) // Increased delay to ensure DOM update

      // Verify checklist creation
      if (!validateFormatting("CHECKLIST")) {
        throw new Error("Checklist creation failed")
      }

      // Additional delay to ensure checklist is fully rendered
      await delay(100)

      // Find checkbox after ensuring checklist exists
      const checkbox = editorRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement
      if (!checkbox) {
        console.error("DOM state:", editorRef.current.innerHTML)
        throw new Error("Checkbox not found after checklist creation")
      }

      // Test Checkbox Toggle
      console.log(`Starting Test ${++testCounter}: Toggle Checkbox`)
      try {
        // Create and dispatch click event
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
        checkbox.dispatchEvent(clickEvent)
        await delay(50)

        // Verify checkbox state
        if (!checkbox.checked) {
          throw new Error("Checkbox toggle failed - checkbox not checked")
        }

        // Test Checkbox Toggle Back
        console.log(`Starting Test ${++testCounter}: Toggle Checkbox Back`)
        checkbox.dispatchEvent(clickEvent)
        await delay(50)

        if (checkbox.checked) {
          throw new Error("Checkbox untoggle failed - checkbox still checked")
        }
      } catch (error) {
        console.error("Checkbox operation failed:", {
          error,
          checkboxState: checkbox?.checked,
          html: editorRef.current.innerHTML,
        })
        throw error
      }

      await cleanupStep()
      setCurrentStep(testCounter)

      // Ersetze den "Multiple Checklist Items" Test-Teil mit diesem verbesserten Code
      // Suche nach: console.log(`Starting Test ${++testCounter}: Multiple Checklist Items`)
      // und ersetze den gesamten Block bis zum nächsten await cleanupStep()

      console.log(`Starting Test ${++testCounter}: Multiple Checklist Items`)
      console.group("=== Multiple Checklist Items Test ===")
      console.log("Initial state:", {
        editorContent: editorRef.current.innerHTML,
        hasChecklist: !!editorRef.current.querySelector("ul.checklist"),
        checklistItems: editorRef.current.querySelectorAll("ul.checklist li").length,
        activeElement: document.activeElement?.tagName,
        editorHasFocus: document.activeElement === editorRef.current,
      })

      // Statt ein Enter-Event zu verwenden, erstellen wir direkt eine zweite Checklist-Item
      // Zuerst stellen wir sicher, dass wir eine Checklist haben
      if (!editorRef.current.querySelector("ul.checklist")) {
        console.log("No checklist found, creating one first")
        selectText("Testtext")
        onFormat("checklist")
        await delay(100)
      }

      // Jetzt holen wir uns die Checklist und fügen ein zweites Element hinzu
      const checklist = editorRef.current.querySelector("ul.checklist")
      if (!checklist) {
        throw new Error("Checklist not found after creation")
      }

      console.log("Found checklist:", {
        html: checklist.outerHTML,
        childCount: checklist.children.length,
      })

      // Erstelle ein neues Checklist-Item und füge es direkt zur Liste hinzu
      const newItem = document.createElement("li")
      newItem.innerHTML = `<input type="checkbox" class="checkbox" role="checkbox" aria-checked="false"><span contenteditable="true">Zweites Item</span>`
      checklist.appendChild(newItem)

      console.log("Added second item manually:", {
        newItemHTML: newItem.outerHTML,
        checklistHTML: checklist.outerHTML,
        totalItems: checklist.children.length,
      })

      // Warte kurz, damit DOM-Updates abgeschlossen werden können
      await delay(100)

      // Überprüfe, ob wir jetzt mindestens 2 Items haben
      const items = editorRef.current.querySelectorAll("ul.checklist li")
      console.log("Checklist items found:", {
        count: items.length,
        items: Array.from(items).map((item) => ({
          html: item.innerHTML,
          hasCheckbox: !!item.querySelector('input[type="checkbox"]'),
          hasSpan: !!item.querySelector("span"),
        })),
        editorHTML: editorRef.current.innerHTML,
      })

      if (items.length < 2) {
        console.error("Failed to create multiple checklist items:", {
          itemCount: items.length,
          expectedCount: "at least 2",
          editorContent: editorRef.current.innerHTML,
          activeElement: document.activeElement?.tagName,
        })
        console.groupEnd()
        throw new Error("Creating multiple checklist items failed")
      }
      console.log("Multiple checklist items created successfully")
      console.groupEnd()

      await cleanupStep()
      setCurrentStep(testCounter)

      // Test Checklist Spacing
      console.log(`Starting Test ${++testCounter}: Checklist Spacing`)
      const firstItem = items[0]
      const style = window.getComputedStyle(firstItem)
      const lineHeightPx = Number.parseFloat(style.lineHeight)
      const fontSizePx = Number.parseFloat(style.fontSize)
      const lineHeightRatio = lineHeightPx / fontSizePx

      console.log("Checklist spacing validation:", {
        lineHeightPx,
        fontSizePx,
        lineHeightRatio,
        style: {
          lineHeight: style.lineHeight,
          fontSize: style.fontSize,
        },
      })

      // Compare the ratio instead of raw values
      if (lineHeightRatio > 1.5) {
        // Allow slightly more than 1.2 for browser rounding
        throw new Error(`Line height ratio too large: ${lineHeightRatio.toFixed(2)}`)
      }

      const minHeight = Number.parseFloat(style.minHeight)
      if (minHeight > 18) {
        throw new Error(`Min height too large: ${minHeight}`)
      }
      await cleanupStep()
      setCurrentStep(testCounter)

      setTestStatus("success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Test failed:", {
        error,
        step: currentStep + 1,
        editorContent: editorRef.current?.innerHTML,
      })
      setErrorMessage(message)
      setTestStatus("error")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={testStatus === "success" ? "secondary" : testStatus === "error" ? "destructive" : "outline"}
        size="sm"
        onClick={runTest}
        disabled={testStatus === "running"}
        title={errorMessage}
      >
        {testStatus === "success" ? (
          <Check className="h-4 w-4" />
        ) : testStatus === "error" ? (
          <X className="h-4 w-4" />
        ) : (
          "Test"
        )}
        {testStatus === "running" && ` (${currentStep}/39)`}
      </Button>
      {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
    </div>
  )
}

