"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ChevronDown,
  Superscript,
  Subscript,
  TextCursor,
  CheckSquare,
} from "lucide-react"
import { SubmitButton } from "./submit-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { EditorStyles } from "./editor-styles"

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  subscript: boolean
  superscript: boolean
  fontSize: "small" | "normal" | "large"
}

const listHandlerRef = useRef({
  createChecklist: (text: string) => {
    const li = document.createElement("li")
    const input = document.createElement("input")
    input.type = "checkbox"
    const span = document.createElement("span")
    span.contentEditable = "true"
    span.textContent = text
    li.appendChild(input)
    li.appendChild(span)
    return li
  },
})

export default function SimpleEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    subscript: false,
    superscript: false,
    fontSize: "normal",
  })

  // Add mutation observer to track DOM changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log("Editor DOM mutation:", {
          type: mutation.type,
          target: mutation.target,
          addedNodes: Array.from(mutation.addedNodes).map((n) => ({
            type: n.nodeType,
            name: n.nodeName,
            class: n instanceof Element ? n.className : null,
          })),
          removedNodes: Array.from(mutation.removedNodes).map((n) => ({
            type: n.nodeType,
            name: n.nodeName,
            class: n instanceof Element ? n.className : null,
          })),
        })
      })
    })

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
    }

    return () => observer.disconnect()
  }, [])

  // Add after the formatState declaration
  const isInitialized = useRef(false)

  const lastSelectionRef = useRef<{
    range: Range
    selection: Selection
  } | null>(null)

  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      lastSelectionRef.current = {
        range: range.cloneRange(),
        selection,
      }
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (lastSelectionRef.current) {
      const { range, selection } = lastSelectionRef.current
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized.current && editorRef.current) {
      const initialContent = `
        <ul>
          <li>Erste Zeile mit Bulletpoint</li>
          <li>Zweite Zeile mit Bulletpoint</li>
        </ul>
        <ol>
          <li>Erste Zeile nummeriert</li>
          <li>Zweite Zeile nummeriert</li>
        </ol>
      `.trim()

      editorRef.current.innerHTML = initialContent
      isInitialized.current = true
    }
  }, [])

  // Überprüft den aktuellen Formatierungszustand
  const checkFormatState = useCallback(() => {
    if (!document.queryCommandSupported) return

    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)
    let fontSize: "small" | "normal" | "large" = "normal"

    if (range) {
      const parentSpan = range.commonAncestorContainer.parentElement?.closest('span[class^="text-"]')
      if (parentSpan) {
        const classes = parentSpan.className.split(" ")
        const sizeClass = classes.find((c) => c.startsWith("text-"))
        if (sizeClass) {
          const size = sizeClass.replace("text-", "")
          if (size === "small" || size === "normal" || size === "large") {
            fontSize = size
          }
        }
      }
    }

    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikethrough"),
      subscript: document.queryCommandState("subscript"),
      superscript: document.queryCommandState("superscript"),
      fontSize,
    })
  }, [])

  const logElementStyle = useCallback((element: Element, label: string) => {
    const style = window.getComputedStyle(element)
    console.log(`\n${label}:`)
    console.log("Font Size:", {
      "Computed Size": style.fontSize,
      "Line Height": style.lineHeight,
      "Class Name": element.className,
      "Expected Size": element.className.includes("text-small")
        ? "14px"
        : element.className.includes("text-normal")
          ? "16px"
          : element.className.includes("text-large")
            ? "20px"
            : "unknown",
    })

    // Add size verification
    const actualSize = Number.parseInt(style.fontSize)
    const expectedSize = element.className.includes("text-small")
      ? 14
      : element.className.includes("text-normal")
        ? 16
        : element.className.includes("text-large")
          ? 20
          : null

    if (expectedSize !== null) {
      console.log("Size Verification:", {
        "Matches Expected": actualSize === expectedSize,
        Difference: actualSize - expectedSize,
      })
    }
  }, [])

  const handleFormat = useCallback(
    async (command: string) => {
      if (!editorRef.current) return

      // Restore selection if we have one saved
      restoreSelection()

      const selection = window.getSelection()
      let range: Range | null = null

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
      }

      if (command === "checklist") {
        console.group("=== Checklist Creation ===")

        // Log initial DOM state
        console.log("Starting checklist creation:", {
          editorContent: editorRef.current?.innerHTML,
          domStructure: Array.from(editorRef.current?.childNodes || []).map((node) => ({
            type: node.nodeType,
            name: node.nodeName,
            text: node.textContent?.slice(0, 50),
            isElement: node instanceof Element,
            classList: node instanceof Element ? Array.from(node.classList) : [],
          })),
        })

        // Step 1: Focus the editor first
        if (document.activeElement !== editorRef.current) {
          editorRef.current.focus()
          // Wait for focus to take effect
          await new Promise((resolve) => setTimeout(resolve, 0))
        }

        console.log("Focus state:", {
          activeElement: document.activeElement,
          isEditor: document.activeElement === editorRef.current,
        })

        // Step 2: Create a new checklist if it doesn't exist
        let list = editorRef.current.querySelector("ul.checklist")
        if (!list) {
          list = document.createElement("ul")
          list.className = "checklist"
          console.log("Created new checklist:", {
            element: list,
            className: list.className,
          })
        }

        // Step 3: Create and position the selection
        if (!selection || selection.rangeCount === 0) {
          range = document.createRange()

          // Find the last text node
          const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
              // Skip empty text nodes and checklist items
              if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
                return NodeFilter.FILTER_SKIP
              }
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).closest("ul.checklist")) {
                return NodeFilter.FILTER_SKIP
              }
              return NodeFilter.FILTER_ACCEPT
            },
          })

          let lastNode: Node = editorRef.current
          let currentNode
          while ((currentNode = walker.nextNode())) {
            lastNode = currentNode
          }

          // Set range after the last valid node
          if (lastNode === editorRef.current) {
            // If no valid nodes found, insert a paragraph
            const p = document.createElement("p")
            p.innerHTML = "<br>"
            editorRef.current.appendChild(p)
            range.selectNodeContents(p)
          } else {
            range.selectNodeContents(lastNode)
            range.collapse(false)
            if (selection) {
              selection.removeAllRanges()
              const newRange = range.cloneRange()
              selection.addRange(newRange)
            }
          }

          // Wait for selection to take effect
          await new Promise((resolve) => setTimeout(resolve, 0))
        } else {
          range = selection.getRangeAt(0)
        }

        // Log before insertion
        console.log("Pre-insertion state:", {
          list: {
            exists: !!list,
            parent: list?.parentNode?.nodeName,
            html: list?.innerHTML,
          },
          selection: {
            exists: !!selection,
            rangeCount: selection?.rangeCount,
            type: selection?.type,
          },
        })

        console.log("Selection state:", {
          hasSelection: !!selection,
          rangeCount: selection?.rangeCount,
          range: range
            ? {
                collapsed: range.collapsed,
                startContainer: range.startContainer.nodeName,
                startOffset: range.startOffset,
              }
            : null,
        })

        // Step 4: Create and insert the checklist item
        if (listHandlerRef.current) {
          const item = listHandlerRef.current.createChecklist("")

          // Find insertion point
          let insertionPoint = range.startContainer
          if (insertionPoint.nodeType === Node.TEXT_NODE && insertionPoint.parentNode) {
            insertionPoint = insertionPoint.parentNode
          }

          // Handle special cases
          if (insertionPoint === editorRef.current) {
            const p = document.createElement("p")
            p.innerHTML = "<br>"
            editorRef.current.appendChild(p)
            insertionPoint = p
          }

          // Insert the list and item
          insertionPoint.parentNode?.insertBefore(list, insertionPoint)
          list.appendChild(item)

          // Add logging after list creation
          console.log("After list creation:", {
            listExists: !!list,
            listHTML: list?.innerHTML,
            parentNode: list?.parentNode?.nodeName,
          })

          // Clean up empty blocks
          if (!insertionPoint.textContent?.trim() && insertionPoint instanceof Element) {
            insertionPoint.remove()
          }

          // Set cursor in the new item
          const span = item.querySelector("span")
          if (span && selection) {
            const newRange = document.createRange()
            newRange.setStart(span, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }

          console.log("Final state:", {
            editorContent: editorRef.current.innerHTML,
            hasFocus: document.activeElement === editorRef.current,
            hasSelection: !!window.getSelection() && window.getSelection()!.rangeCount > 0,
          })
        }

        // Log after insertion
        console.log("Post-insertion state:", {
          listInDOM: document.contains(list),
          listHTML: list.innerHTML,
          editorHTML: editorRef.current.innerHTML,
          selection: {
            exists: !!window.getSelection(),
            rangeCount: window.getSelection()?.rangeCount,
            type: window.getSelection()?.type,
          },
        })

        console.groupEnd()
        return
      } else if (command === "insertUnorderedList" || command === "insertOrderedList") {
        const listType = command === "insertUnorderedList" ? "ul" : "ol"

        // Prüfe, ob range existiert
        if (!range) return

        // Erweitere die Range auf vollständige Elemente
        let startNode: Node | null = range.startContainer
        let endNode: Node | null = range.endContainer

        // Finde die tatsächlichen Start- und End-Elemente
        while (startNode && !["LI", "P"].includes(startNode.nodeName)) {
          const parentElement: Node | null = startNode.parentNode
          if (!parentElement) break
          startNode = parentElement
        }
        while (endNode && !["LI", "P"].includes(endNode.nodeName)) {
          const parentElement: Node | null = endNode.parentNode
          if (!parentElement) break
          endNode = parentElement
        }

        // Wenn wir Elemente gefunden haben, passe die Range an
        if (startNode && endNode) {
          range.setStartBefore(startNode)
          range.setEndAfter(endNode)
        }

        // Extrahiere den selektierten Inhalt
        const selectedContent = range.cloneContents()
        const tempDiv = document.createElement("div")
        tempDiv.appendChild(selectedContent)

        // Sammle alle Textzeilen und prüfe den aktuellen Zustand
        let lines: string[] = []
        let isInList = false
        let isInSameListType = false

        // Prüfe auf verschiedene Elementtypen
        const listItems = tempDiv.querySelectorAll("li")
        const paragraphs = tempDiv.querySelectorAll("p")

        if (listItems.length > 0) {
          // Sammle Text aus Listenpunkten
          lines = Array.from(listItems)
            .map((item) => item.textContent || "")
            .filter((text) => text.trim())

          // Prüfe, ob wir in einer Liste sind
          const parentList = listItems[0].parentElement
          isInList = true
          isInSameListType = parentList?.tagName.toLowerCase() === listType
        } else if (paragraphs.length > 0) {
          // Sammle Text aus Paragraphen
          lines = Array.from(paragraphs)
            .map((p) => p.textContent || "")
            .filter((text) => text.trim())
        } else {
          // Fallback: Teile nach Zeilenumbrüchen
          const content = tempDiv.textContent || ""
          lines = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line)

          // Prüfe den übergeordneten Kontext
          let currentNode: Node | null = range.commonAncestorContainer
          while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeName === "UL" || currentNode.nodeName === "OL") {
              isInList = true
              isInSameListType = currentNode.nodeName.toLowerCase() === listType
              break
            }
            const parentElement: Node | null = currentNode.parentNode
            if (!parentElement) break
            currentNode = parentElement
          }
        }

        // Erstelle das neue Fragment
        const fragment = document.createDocumentFragment()

        if (!isInList || !isInSameListType) {
          // Erstelle eine neue Liste oder konvertiere zu anderer Listenart
          const list = document.createElement(listType)
          lines.forEach((line) => {
            const li = document.createElement("li")
            li.textContent = line
            list.appendChild(li)
          })
          fragment.appendChild(list)
        } else {
          // Konvertiere zu Text
          lines.forEach((line) => {
            const p = document.createElement("p")
            p.textContent = line
            fragment.appendChild(p)
          })
        }

        // Ersetze den selektierten Inhalt
        range.deleteContents()
        range.insertNode(fragment)

        // Bereinige den DOM
        const cleanup = (node: Node) => {
          // Entferne leere Text-Nodes
          if (
            node.nodeType === Node.TEXT_NODE &&
            !node.textContent?.trim() &&
            !["P", "LI"].includes(node.parentNode?.nodeName || "")
          ) {
            node.parentNode?.removeChild(node)
            return
          }

          // Entferne leere Listen
          if ((node.nodeName === "UL" || node.nodeName === "OL") && !node.hasChildNodes()) {
            node.parentNode?.removeChild(node)
            return
          }

          // Entferne verschachtelte Listen der gleichen Art
          if ((node.nodeName === "UL" || node.nodeName === "OL") && node.parentNode?.nodeName === node.nodeName) {
            const parent = node.parentNode
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node)
            }
            node.parentNode?.removeChild(node)
            return
          }

          Array.from(node.childNodes).forEach(cleanup)
        }

        cleanup(editorRef.current)

        // Normalisiere den DOM
        editorRef.current.normalize()

        // Aktualisiere die Selektion
        const newRange = document.createRange()
        const lastNode = fragment.lastChild
        if (lastNode) {
          newRange.selectNodeContents(lastNode)
          newRange.collapse(false)
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        }
      } else if (command.startsWith("fontSize-")) {
        const size = command.split("-")[1]

        // Prüfe, ob range existiert
        if (!range) return

        console.log(`\nAktion: Textgröße auf "${size}" ändern`)
        console.log("Vor Textgröße-Änderung:", editorRef.current.innerHTML)

        // Store the original range
        const originalRange = range.cloneRange()

        // Adjust range if it starts/ends in an element node
        if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
          const textNode = range.startContainer.childNodes[range.startOffset]
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            range.setStart(textNode, 0)
          }
        }
        if (range.endContainer.nodeType === Node.ELEMENT_NODE) {
          const textNode = range.endContainer.childNodes[Math.max(0, range.endOffset - 1)]
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            range.setEnd(textNode, textNode.textContent?.length || 0)
          }
        }

        // Validate and adjust range if needed
        const validateRange = (range: Range) => {
          const startLength = range.startContainer.textContent?.length || 0
          const endLength = range.endContainer.textContent?.length || 0

          if (range.startOffset > startLength) {
            range.setStart(range.startContainer, startLength)
          }
          if (range.endOffset > endLength) {
            range.setEnd(range.endContainer, endLength)
          }
        }
        validateRange(range)

        console.log("Adjusted Range Start:", range.startContainer, "Offset:", range.startOffset)
        console.log("Adjusted Range End:", range.endContainer, "Offset:", range.endOffset)

        // Find existing text-size spans that intersect with our selection
        const existingSpans = Array.from(editorRef.current.getElementsByTagName("span")).filter((span) => {
          return span.className.startsWith("text-") && range && range.intersectsNode(span)
        })

        // Remove existing formatting while preserving content and cleaning up whitespace
        existingSpans.forEach((span) => {
          console.log("Existierende Formatierung gefunden:")
          logElementStyle(span, "Alter Stil")

          const parent = span.parentNode
          const text = span.textContent
          if (text && parent) {
            const textNode = document.createTextNode(text)
            parent.insertBefore(textNode, span)
          }
          span.parentNode?.removeChild(span)
        })

        // Remove any empty text nodes or unnecessary whitespace spans
        const cleanup = (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "SPAN") {
            const span = node as Element
            if (!span.className || !span.className.startsWith("text-")) {
              const text = span.textContent
              if (text) {
                const textNode = document.createTextNode(text)
                span.parentNode?.insertBefore(textNode, span)
              }
              span.parentNode?.removeChild(span)
              return
            }
          }
          Array.from(node.childNodes).forEach(cleanup)
        }
        cleanup(editorRef.current)

        editorRef.current.normalize()

        console.log("Nach Entfernung der Formatierung:", editorRef.current.innerHTML)

        // Only apply new formatting if not "normal"
        if (size !== "normal") {
          try {
            // Validate selection still exists
            if (window.getSelection()?.rangeCount === 0) {
              window.getSelection()?.addRange(originalRange)
            }

            const span = document.createElement("span")
            span.className = `text-${size}`

            // Ensure range is still valid
            validateRange(originalRange)

            try {
              originalRange.surroundContents(span)
              console.log("Neue Formatierung angewendet:")
              logElementStyle(span, "Neuer Stil")
            } catch (error) {
              console.log("Fehler beim direkten Formatieren:", error)
              // Alternative method for split nodes
              const fragment = originalRange.extractContents()
              span.appendChild(fragment)
              originalRange.insertNode(span)
              console.log("Neue Formatierung angewendet (alternative Methode):")
              logElementStyle(span, "Neuer Stil")
            }
          } catch (error) {
            console.error("Fehler bei der Textformatierung:", error)
          }

          console.log("\nSize Comparison:")
          console.log("Previous Size:", {
            Size: size === "small" ? "14px" : size === "large" ? "20px" : "16px",
            Class: `text-${size}`,
          })

          // Get all text-size spans in the editor for verification
          const allSizeSpans = editorRef.current.querySelectorAll('span[class^="text-"]')
          allSizeSpans.forEach((span, index) => {
            const style = window.getComputedStyle(span)
            console.log(`Span ${index + 1}:`, {
              Size: style.fontSize,
              Class: span.className,
            })
          })
        }

        console.log("Nach Anwendung neuer Formatierung:", editorRef.current.innerHTML)
        checkFormatState()
      } else if (command === "superscript" || command === "subscript") {
        const tagName = command === "superscript" ? "SUP" : "SUB"

        // Prüfe, ob range existiert
        if (!range) return

        console.log("Vor Hoch-/Tiefstellung:", editorRef.current.innerHTML)

        // Finde das nächstgelegene sup/sub Element
        let currentNode: Node | null = range.commonAncestorContainer
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const parentNode = currentNode.parentNode
          if (!parentNode) return
          currentNode = parentNode
        }

        const existingElement = (currentNode as Element).closest(tagName.toLowerCase())

        if (existingElement) {
          // Wenn bereits hoch-/tiefgestellt, entferne die Formatierung
          const parent = existingElement.parentNode
          if (parent) {
            while (existingElement.firstChild) {
              parent.insertBefore(existingElement.firstChild, existingElement)
            }
            existingElement.parentNode?.removeChild(existingElement)
          }
          console.log("Nach Entfernung Hoch-/Tiefstellung:", editorRef.current.innerHTML)
        } else {
          // Wenn nicht hoch-/tiefgestellt, wende die Formatierung an
          document.execCommand(command, false)
          console.log("Nach Anwendung Hoch-/Tiefstellung:", editorRef.current.innerHTML)
        }

        checkFormatState()
      } else {
        document.execCommand(command, false)
        checkFormatState()
      }
    },
    [checkFormatState, restoreSelection, logElementStyle],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      console.group("=== Enter Key Handler ===")
      console.log("Enter key pressed:", {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        activeElement: document.activeElement?.tagName,
        editorHasFocus: document.activeElement === editorRef.current,
        initialHTML: editorRef.current?.innerHTML,
      })

      e.preventDefault()

      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)

      console.log("Selection state:", {
        hasSelection: !!selection,
        rangeCount: selection?.rangeCount,
        range: range
          ? {
              collapsed: range.collapsed,
              startContainer: {
                type: range.startContainer.nodeType,
                name: range.startContainer.nodeName,
                text: range.startContainer.textContent?.slice(0, 50),
                parent: range.startContainer.parentNode?.nodeName,
              },
              endContainer: {
                type: range.endContainer.nodeType,
                name: range.endContainer.nodeName,
                text: range.endContainer.textContent?.slice(0, 50),
                parent: range.endContainer.parentNode?.nodeName,
              },
              commonAncestor: range.commonAncestorContainer.nodeName,
            }
          : null,
      })

      if (range) {
        const currentNode = range.commonAncestorContainer
        // closest() ist nur auf Element-Objekten verfügbar, nicht auf allgemeinen Nodes
        const element = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : (currentNode as Element)
        const listItem = element?.closest("li")

        console.log("Node context:", {
          currentNode: {
            type: currentNode.nodeType,
            name: currentNode.nodeName,
            text: currentNode.textContent?.slice(0, 50),
            parent: currentNode.parentNode?.nodeName,
            isInEditor: editorRef.current?.contains(currentNode),
          },
          listItem: listItem
            ? {
                type: listItem.nodeName,
                className: listItem.className,
                text: listItem.textContent?.slice(0, 50),
                isChecklist: listItem.parentElement?.classList.contains("checklist"),
                structure: listItem.innerHTML,
                parent: listItem.parentElement?.nodeName,
              }
            : null,
        })

        // Check if we're in a checklist
        if (listItem?.parentElement?.classList.contains("checklist")) {
          console.log("Checklist item detected:", {
            isEmpty: !listItem.textContent?.trim(),
            content: listItem.innerHTML,
            parentList: listItem.innerHTML,
            siblingCount: listItem.parentElement.children.length,
            position: Array.from(listItem.parentElement.children).indexOf(listItem),
          })

          // If empty, end the list
          if (!listItem.textContent?.trim()) {
            console.log("Empty checklist item - ending list")
            const list = listItem.parentElement
            const newParagraph = document.createElement("p")
            newParagraph.innerHTML = "<br>"
            list?.parentNode?.insertBefore(newParagraph, list.nextSibling)
            listItem.remove()

            console.log("After ending list:", {
              listEmpty: !list?.hasChildNodes(),
              newParagraphInserted: !!newParagraph.parentNode,
              newParagraphStructure: newParagraph.innerHTML,
              editorContent: editorRef.current?.innerHTML,
              remainingItems: list?.children.length,
            })

            if (list && !list.hasChildNodes()) {
              list.remove()
              console.log("Empty list removed")
            }

            const newRange = document.createRange()
            newRange.setStart(newParagraph, 0)
            newRange.collapse(true)
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(newRange)
            }

            console.log("New selection set:", {
              hasSelection: !!window.getSelection() && window.getSelection()!.rangeCount > 0,
              newRange: {
                collapsed: newRange.collapsed,
                startContainer: newRange.startContainer.nodeName,
                startOffset: newRange.startOffset,
                endContainer: newRange.endContainer.nodeName,
                endOffset: newRange.endOffset,
              },
              focusNode: document.activeElement,
            })
          } else {
            console.log("Non-empty checklist item - creating new item")
            // Create new checklist item
            const list = listItem.parentElement
            const newItem = listHandlerRef.current.createChecklist("")

            console.log("New item created:", {
              itemStructure: newItem.innerHTML,
              hasCheckbox: !!newItem.querySelector('input[type="checkbox"]'),
              hasSpan: !!newItem.querySelector("span"),
              parentList: {
                type: list?.nodeName,
                className: list?.className,
                childCount: list?.children.length,
              },
            })

            // Split content if cursor is in middle of text
            const span = listItem.querySelector("span")
            if (span && range.startContainer === span.firstChild) {
              console.log("Splitting content at cursor:", {
                cursorOffset: range.startOffset,
                totalLength: span.textContent?.length,
                beforeCursor: span.textContent?.slice(0, range.startOffset),
                afterCursor: span.textContent?.slice(range.startOffset),
              })

              const afterCursor = span.textContent?.slice(range.startOffset) || ""
              span.textContent = span.textContent?.slice(0, range.startOffset) || ""

              const newItemSpan = newItem.querySelector("span")
              if (newItemSpan && afterCursor) {
                newItemSpan.textContent = afterCursor
              }
            }

            if (listItem.nextSibling) {
              list?.insertBefore(newItem, listItem.nextSibling)
            } else {
              list?.appendChild(newItem)
            }

            const newItemSpan = newItem.querySelector("span")
            if (newItemSpan) {
              const newRange = document.createRange()
              newRange.setStart(newItemSpan, 0)
              newRange.collapse(true)
              if (selection) {
                selection.removeAllRanges()
                selection.addRange(newRange)
              }

              console.log("Cursor positioned in new item:", {
                hasSelection: !!window.getSelection() && window.getSelection()!.rangeCount > 0,
                isInSpan: window.getSelection()?.anchorNode === newItemSpan,
                spanContent: newItemSpan.innerHTML,
                editorContent: editorRef.current?.innerHTML,
              })
            }
          }
          console.groupEnd()
          return
        }
        // Prüfe ob wir in einem Listenelement sind
        else if (listItem?.tagName === "LI") {
          // Wenn der Listenpunkt leer ist (nur Whitespace enthält)
          if (!listItem.textContent?.trim()) {
            // Beende die Liste
            const list = listItem.parentElement
            const newParagraph = document.createElement("p")
            newParagraph.innerHTML = "<br>"
            list?.parentNode?.insertBefore(newParagraph, list.nextSibling)
            listItem.remove()
            // Wenn die Liste leer ist, entferne sie
            if (list && !list.hasChildNodes()) {
              list.remove()
            }

            // Setze den Cursor in den neuen Paragraphen
            const newRange = document.createRange()
            newRange.setStart(newParagraph, 0)
            newRange.collapse(true)
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          } else {
            // Füge neuen Listenpunkt ein
            const list = listItem.parentElement
            const newItem = document.createElement("li")
            newItem.innerHTML = "<br>"

            // Füge nach dem aktuellen Element ein
            if (listItem.nextSibling) {
              list?.insertBefore(newItem, listItem.nextSibling)
            } else {
              list?.appendChild(newItem)
            }

            // Setze den Cursor in das neue Element
            const newRange = document.createRange()
            newRange.selectNodeContents(newItem)
            newRange.collapse(true)
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          }
        } else {
          document.execCommand("insertLineBreak", false)
        }
      }
      console.groupEnd()
    }
  }

  // Event-Handler für Selektionsänderungen
  const handleSelectionChange = useCallback(() => {
    checkFormatState()
  }, [checkFormatState])

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [handleSelectionChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.target as HTMLElement).closest(".editor-content")) return

      // Verhindere Browser-Defaults für diese Shortcuts
      if (
        (e.ctrlKey && ["b", "i", "u"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x")
      ) {
        e.preventDefault()
      }

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            handleFormat("bold")
            break
          case "i":
            handleFormat("italic")
            break
          case "u":
            handleFormat("underline")
            break
        }
      }

      if (e.ctrlKey && e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "x":
            handleFormat("strikethrough")
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleFormat])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleBlur = () => {
      saveSelection()
    }

    editor.addEventListener("blur", handleBlur)
    return () => {
      editor.removeEventListener("blur", handleBlur)
    }
  }, [saveSelection])

  // Add focus/blur logging
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleFocus = () => {
      console.log("Editor focused:", {
        activeElement: document.activeElement,
        selection: window.getSelection()?.toString(),
      })
    }

    const handleBlur = () => {
      console.log("Editor blurred:", {
        activeElement: document.activeElement,
        selection: window.getSelection()?.toString(),
      })
    }

    editor.addEventListener("focus", handleFocus)
    editor.addEventListener("blur", handleBlur)

    return () => {
      editor.removeEventListener("focus", handleFocus)
      editor.removeEventListener("blur", handleBlur)
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    console.group("ListHandler Initialization")
    console.log("Editor ref available:", !!editorRef.current)
    console.log("Current ListHandler:", listHandlerRef.current)

    const handleCheckboxClick = (e: MouseEvent) => {
      console.group("Checkbox Click Handler")
      console.log("Click event:", {
        target: e.target,
        currentTarget: e.currentTarget,
        eventPhase: e.eventPhase === 1 ? "CAPTURING" : e.eventPhase === 2 ? "AT_TARGET" : "BUBBLING",
      })
      console.log("Focus state:", {
        activeElement: document.activeElement?.tagName,
        editorHasFocus: document.activeElement === editorRef.current,
        selectionExists: !!window.getSelection()?.rangeCount,
      })

      const target = e.target as HTMLElement
      if (target.matches('input[type="checkbox"]')) {
        console.log("Valid checkbox target:", {
          type: target.getAttribute("type"),
          checked: (target as HTMLInputElement).checked,
          parentListItem: target.closest("li")?.innerHTML,
        })

        e.preventDefault()
        e.stopPropagation()

        const listItem = target.closest("li")
        if (listItem) {
          const checkbox = target as HTMLInputElement
          const oldState = checkbox.checked
          checkbox.checked = !oldState
          listItem.classList.toggle("checked", checkbox.checked)

          console.log("Checkbox state updated:", {
            oldState,
            newState: checkbox.checked,
            listItemClasses: listItem.className,
            listItemContent: listItem.innerHTML,
          })
        }
      }
      console.groupEnd()
    }

    if (editor) {
      editor.addEventListener("click", handleCheckboxClick, true)
      console.log("Click handler bound in capture phase")
    }

    if (!listHandlerRef.current) {
      listHandlerRef.current = {
        createChecklist: (text: string) => {
          console.log("Creating checklist item with text:", text)
          const li = document.createElement("li")
          const input = document.createElement("input")
          input.type = "checkbox"
          const span = document.createElement("span")
          span.contentEditable = "true"
          span.textContent = text
          li.appendChild(input)
          li.appendChild(span)
          return li
        },
      }
      console.log("ListHandler initialized")
    }

    console.groupEnd()

    return () => {
      console.log("Cleanup: Removing click handler")
      if (editor) {
        editor.removeEventListener("click", handleCheckboxClick, true)
      }
    }
  }, []) // Empty deps array ensures single initialization

  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  return (
    <>
      <EditorStyles />
      <Card className="w-full">
        <CardContent className="p-4">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4 flex items-center gap-2">
              {/* Textformatierung Gruppe */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Fett (Ctrl+B)"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("bold")
                  }}
                  className={cn("h-8 w-8", formatState.bold && "bg-accent text-accent-foreground")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Kursiv (Ctrl+I)"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("italic")
                  }}
                  className={cn("h-8 w-8", formatState.italic && "bg-accent text-accent-foreground")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Unterstrichen (Ctrl+U)"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("underline")
                  }}
                  className={cn("h-8 w-8", formatState.underline && "bg-accent text-accent-foreground")}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Durchgestrichen (Ctrl+Shift+X)"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("strikethrough")
                  }}
                  className={cn("h-8 w-8", formatState.strikethrough && "bg-accent text-accent-foreground")}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "h-8 px-3 inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      (formatState.subscript || formatState.superscript || formatState.fontSize !== "normal") &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    <span>Erweitert</span>
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    aria-describedby="dropdown-description"
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align="start"
                    sideOffset={4}
                  >
                    <div id="dropdown-description" className="sr-only">
                      Erweiterte Formatierungsoptionen für Text
                    </div>
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
                      <DropdownMenuSubContent
                        aria-describedby="text-size-description"
                        className={cn(
                          "w-56 rounded-lg",
                          isMobile && "mt-1", // Füge etwas Abstand hinzu für mobile Geräte
                        )}
                      >
                        <div id="text-size-description" className="sr-only">
                          Textgrößenoptionen zum Formatieren des ausgewählten Texts
                        </div>
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

              <div className="mx-1 w-px h-6 bg-border" />

              {/* Listen Gruppe */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("insertUnorderedList")
                  }}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleFormat("insertOrderedList")
                  }}
                  className="h-8 w-8"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Checkliste"
                  onClick={(e) => {
                    e.preventDefault()
                    console.group("=== Checklist Button Click ===")

                    // Log initial DOM state and selection
                    const initialSelection = window.getSelection()
                    const initialRange = initialSelection?.getRangeAt(0)

                    console.log("Initial state:", {
                      editorContent: editorRef.current?.innerHTML,
                      activeElement: document.activeElement?.tagName,
                      editorHasFocus: document.activeElement === editorRef.current,
                      selection: initialSelection
                        ? {
                            exists: true,
                            rangeCount: initialSelection.rangeCount,
                            type: initialSelection.type,
                            text: initialSelection.toString(),
                            range: initialRange
                              ? {
                                  collapsed: initialRange.collapsed,
                                  startContainer: {
                                    type: initialRange.startContainer.nodeType,
                                    name: initialRange.startContainer.nodeName,
                                    text: initialRange.startContainer.textContent?.slice(0, 50),
                                    isText: initialRange.startContainer.nodeType === Node.TEXT_NODE,
                                    parent: initialRange.startContainer.parentNode?.nodeName,
                                    parentHTML:
                                      initialRange.startContainer.parentNode instanceof Element
                                        ? (initialRange.startContainer.parentNode as Element).innerHTML
                                        : undefined,
                                  },
                                  endContainer: {
                                    type: initialRange.endContainer.nodeType,
                                    name: initialRange.endContainer.nodeName,
                                    text: initialRange.endContainer.textContent?.slice(0, 50),
                                    isText: initialRange.endContainer.nodeType === Node.TEXT_NODE,
                                    parent: initialRange.endContainer.parentNode?.nodeName,
                                    parentHTML:
                                      initialRange.endContainer.parentNode instanceof Element
                                        ? (initialRange.endContainer.parentNode as Element).innerHTML
                                        : undefined,
                                  },
                                }
                              : null,
                          }
                        : {
                            exists: false,
                          },
                    })

                    // Focus the editor and wait a moment
                    editorRef.current?.focus()

                    // Log post-focus state
                    const postFocusSelection = window.getSelection()
                    const postFocusRange = postFocusSelection?.getRangeAt(0)

                    console.log("Post-focus state:", {
                      activeElement: document.activeElement?.tagName,
                      editorHasFocus: document.activeElement === editorRef.current,
                      selection: postFocusSelection
                        ? {
                            exists: true,
                            rangeCount: postFocusSelection.rangeCount,
                            type: postFocusSelection.type,
                            text: postFocusSelection.toString(),
                            range: postFocusRange
                              ? {
                                  collapsed: postFocusRange.collapsed,
                                  startContainer: {
                                    type: postFocusRange.startContainer.nodeType,
                                    name: postFocusRange.startContainer.nodeName,
                                    text: postFocusRange.startContainer.textContent?.slice(0, 50),
                                    isText: postFocusRange.startContainer.nodeType === Node.TEXT_NODE,
                                    parent: postFocusRange.startContainer.parentNode?.nodeName,
                                    parentHTML:
                                      postFocusRange.startContainer.parentNode instanceof Element
                                        ? (postFocusRange.startContainer.parentNode as Element).innerHTML
                                        : undefined,
                                  },
                                }
                              : null,
                          }
                        : {
                            exists: false,
                          },
                    })

                    handleFormat("checklist")

                    // Log final state
                    const finalSelection = window.getSelection()
                    const finalRange = finalSelection?.getRangeAt(0)

                    console.log("Final state:", {
                      editorContent: editorRef.current?.innerHTML,
                      activeElement: document.activeElement?.tagName,
                      editorHasFocus: document.activeElement === editorRef.current,
                      selection: finalSelection
                        ? {
                            exists: true,
                            rangeCount: finalSelection.rangeCount,
                            type: finalSelection.type,
                            text: finalSelection.toString(),
                            range: finalRange
                              ? {
                                  collapsed: finalRange.collapsed,
                                  startContainer: {
                                    type: finalRange.startContainer.nodeType,
                                    name: finalRange.startContainer.nodeName,
                                    text: finalRange.startContainer.textContent?.slice(0, 50),
                                    isText: finalRange.startContainer.nodeType === Node.TEXT_NODE,
                                    parent: finalRange.startContainer.parentNode?.nodeName,
                                    parentHTML:
                                      finalRange.startContainer.parentNode instanceof Element
                                        ? (finalRange.startContainer.parentNode as Element).innerHTML
                                        : undefined,
                                  },
                                }
                              : null,
                          }
                        : {
                            exists: false,
                          },
                    })

                    console.groupEnd()
                  }}
                  className="h-8 px-2"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  <span className="text-xs">Checkliste</span>
                </Button>
              </div>
            </div>

            <div
              ref={editorRef}
              className="editor-content w-full rounded-md border border-input px-3 py-2 text-base ring-offset-phase"
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onMouseUp={saveSelection}
            />

            <div className="mt-4">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

