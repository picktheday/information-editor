type ListType = "ul" | "ol" | "checklist"

export class ListHandler {
  private editorRef: HTMLDivElement

  constructor(editorRef: HTMLDivElement) {
    this.editorRef = editorRef
  }

  private getListItemLevel(li: HTMLLIElement): number {
    let level = 0
    let parent = li.parentElement
    while (parent && (parent.tagName === "UL" || parent.tagName === "OL")) {
      level++
      parent = parent.parentElement ? parent.parentElement.closest("ul, ol") : null
    }
    return level
  }

  private findParentListItem(node: Node): HTMLLIElement | null {
    let current: Node | null = node
    while (current && current !== this.editorRef) {
      if (current instanceof HTMLLIElement) {
        return current
      }
      current = current.parentNode
    }
    return null
  }

  public handleTab(event: KeyboardEvent): boolean {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    const listItem = this.findParentListItem(range.commonAncestorContainer)

    if (!listItem) return false

    event.preventDefault()

    if (event.shiftKey) {
      return this.outdentListItem(listItem)
    } else {
      return this.indentListItem(listItem)
    }
  }

  private indentListItem(li: HTMLLIElement): boolean {
    const level = this.getListItemLevel(li)
    if (level >= 5) return false // Maximum nesting level

    const previousLi = li.previousElementSibling as HTMLLIElement
    if (!previousLi) return false

    const parentList = li.parentElement as HTMLUListElement | HTMLOListElement
    let targetList = previousLi.querySelector(parentList.tagName.toLowerCase())

    if (!targetList) {
      targetList = document.createElement(parentList.tagName)
      previousLi.appendChild(targetList)
    }

    targetList.appendChild(li)
    return true
  }

  private outdentListItem(li: HTMLLIElement): boolean {
    const parentList = li.parentElement as HTMLUListElement | HTMLOListElement
    if (!parentList || !parentList.parentElement?.closest("ul, ol")) return false

    const parentLi = parentList.parentElement
    const grandparentList = parentLi.parentElement

    // Prüfen, ob grandparentList existiert
    if (!grandparentList) return false

    // Move the list item after its parent li
    grandparentList.insertBefore(li, parentLi.nextSibling)

    // If the list is now empty, remove it
    if (!parentList.hasChildNodes()) {
      parentList.remove()
    }

    return true
  }

  public toggleCheckbox(li: HTMLLIElement): void {
    console.group("=== Toggle Checkbox ===")
    console.log("Initial state:", {
      listItem: {
        html: li.outerHTML,
        classList: Array.from(li.classList),
        hasCheckbox: !!li.querySelector('input[type="checkbox"]'),
      },
    })

    const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement
    if (checkbox) {
      const oldState = checkbox.checked
      checkbox.checked = !oldState
      li.classList.toggle("checked", checkbox.checked)

      console.log("Checkbox state updated:", {
        oldState,
        newState: checkbox.checked,
        listItemClasses: Array.from(li.classList),
        checkboxStyle: {
          backgroundColor: checkbox.style.backgroundColor,
          borderColor: checkbox.style.borderColor,
        },
      })

      // Ensure the checkbox state is visually updated
      requestAnimationFrame(() => {
        checkbox.style.backgroundColor = checkbox.checked ? "hsl(var(--primary))" : "hsl(var(--background))"
        checkbox.style.borderColor = checkbox.checked ? "hsl(var(--primary))" : "hsl(var(--input))"

        console.log("Visual update applied:", {
          backgroundColor: checkbox.style.backgroundColor,
          borderColor: checkbox.style.borderColor,
        })
      })

      // Dispatch a change event
      const event = new Event("change", { bubbles: true })
      checkbox.dispatchEvent(event)
      console.log("Change event dispatched")
    } else {
      console.warn("No checkbox found in list item")
    }
    console.groupEnd()
  }

  public handleCheckboxSyntax(text: string): HTMLElement | null {
    // Match both empty and filled checkboxes, more permissive with spaces
    const checkboxPattern = /^\s*\[\s*x?\s*\]\s*(.*)$/i
    const match = text.match(checkboxPattern)

    if (match) {
      const content = match[1]
      const isChecked = text.toLowerCase().includes("x")
      return this.createChecklist(content, isChecked)
    }

    return null
  }

  public createChecklist(text: string, isChecked = false): HTMLElement {
    console.group("=== Checklist Item Creation ===")

    try {
      console.log("Creating checklist item:", {
        text,
        isChecked,
        editorFocused: document.activeElement?.classList.contains("editor-content"),
        currentSelection: {
          exists: !!window.getSelection(),
          text: window.getSelection()?.toString(),
          rangeCount: window.getSelection()?.rangeCount,
        },
      })

      // Create all elements first
      const li = document.createElement("li")
      const checkbox = document.createElement("input")
      const span = document.createElement("span")

      // Configure elements
      li.className = isChecked ? "checked" : ""

      checkbox.type = "checkbox"
      checkbox.checked = isChecked
      checkbox.className = "checkbox"
      checkbox.setAttribute("role", "checkbox")
      checkbox.setAttribute("aria-checked", isChecked.toString())

      span.contentEditable = "true"
      span.textContent = text

      // Validate elements before assembly
      if (!li || !checkbox || !span) {
        throw new Error("Failed to create checklist elements")
      }

      console.log("Elements created:", {
        li: {
          className: li.className,
          element: li,
        },
        checkbox: {
          type: checkbox.type,
          checked: checkbox.checked,
          element: checkbox,
        },
        span: {
          contentEditable: span.contentEditable,
          textContent: span.textContent,
          element: span,
        },
      })

      // Assemble the structure
      li.appendChild(checkbox)
      li.appendChild(span)

      console.log("Final item:", {
        html: li.outerHTML,
        hasCheckbox: !!li.querySelector('input[type="checkbox"]'),
        hasSpan: !!li.querySelector("span"),
        spanEditable: li.querySelector("span")?.isContentEditable,
      })

      return li
    } catch (error) {
      console.error("Error creating checklist item:", error)
      // Create a fallback minimal item
      const fallbackLi = document.createElement("li")
      fallbackLi.innerHTML = `<input type="checkbox"><span contenteditable="true">${text}</span>`
      return fallbackLi
    } finally {
      console.groupEnd()
    }
  }

  public convertToChecklist(listItem: HTMLLIElement): void {
    const text = listItem.textContent || ""
    const newItem = this.createChecklist(text)
    listItem.parentElement?.replaceChild(newItem, listItem)
  }

  public handleChecklistEnter(e: KeyboardEvent): boolean {
    console.group("=== Checklist Enter Handler ===")
    const selection = window.getSelection()
    console.log("Initial state:", {
      hasSelection: !!selection,
      rangeCount: selection?.rangeCount,
      activeElement: document.activeElement?.tagName,
      editorHasFocus: document.activeElement === this.editorRef,
      keyEvent: {
        key: e.key,
        keyCode: e.keyCode,
        type: e.type,
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
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
      },
      editorContent: this.editorRef.innerHTML,
    })

    if (!selection || selection.rangeCount === 0) {
      console.log("No valid selection found", {
        selection: selection
          ? {
              type: selection.type,
              anchorNode: selection.anchorNode?.nodeName,
              focusNode: selection.focusNode?.nodeName,
              rangeCount: selection.rangeCount,
            }
          : "null",
        activeElement: document.activeElement?.tagName,
        editorHasFocus: document.activeElement === this.editorRef,
      })
      console.groupEnd()
      return false
    }

    const range = selection.getRangeAt(0)

    // Move debug logging here, after range is initialized
    console.log("Enter key handling:", {
      selection: {
        type: selection.type,
        anchorNode: selection.anchorNode?.nodeName,
        focusNode: selection.focusNode?.nodeName,
        isCollapsed: selection.isCollapsed,
      },
      range: {
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        startContainer: {
          type: range.startContainer.nodeType,
          name: range.startContainer.nodeName,
          isText: range.startContainer.nodeType === Node.TEXT_NODE,
          parentName: range.startContainer.parentNode?.nodeName,
        },
        endContainer: {
          type: range.endContainer.nodeType,
          name: range.endContainer.nodeName,
          isText: range.endContainer.nodeType === Node.TEXT_NODE,
          parentName: range.endContainer.parentNode?.nodeName,
        },
      },
      domContext: {
        activeElement: document.activeElement?.tagName,
        editorHasFocus: document.activeElement === this.editorRef,
        caretPosition: selection.getRangeAt(0)?.startOffset,
      },
    })

    const listItem = this.findParentListItem(range.commonAncestorContainer)
    console.log("List item found:", {
      exists: !!listItem,
      isChecklist: listItem?.closest("ul.checklist") !== null,
      html: listItem?.innerHTML,
      text: listItem?.textContent,
      commonAncestorContainer: {
        nodeType: range.commonAncestorContainer.nodeType,
        nodeName: range.commonAncestorContainer.nodeName,
        parentNode: range.commonAncestorContainer.parentNode?.nodeName,
        isInEditor: this.editorRef.contains(range.commonAncestorContainer),
      },
      editorChildNodes: Array.from(this.editorRef.childNodes).map((node) => ({
        nodeType: node.nodeType,
        nodeName: node.nodeName,
        isChecklist: node.nodeName === "UL" && (node as Element).classList.contains("checklist"),
      })),
    })

    if (!listItem?.closest("ul.checklist")) {
      console.log("Not in a checklist", {
        listItem: listItem
          ? {
              nodeName: listItem.nodeName,
              parentNode: listItem.parentNode?.nodeName,
              classList: Array.from(listItem.classList),
              closestUL: !!listItem.closest("ul"),
              closestOL: !!listItem.closest("ol"),
            }
          : "null",
        editorHasChecklist: !!this.editorRef.querySelector("ul.checklist"),
        checklistItems: Array.from(this.editorRef.querySelectorAll("ul.checklist li")).map((item) => ({
          html: item.innerHTML.substring(0, 50),
          hasCheckbox: !!item.querySelector('input[type="checkbox"]'),
        })),
      })
      console.groupEnd()
      return false
    }

    e.preventDefault()

    const list = listItem.parentElement
    const isEmpty = !listItem.querySelector("span")?.textContent?.trim()
    console.log("List state:", {
      parentList: {
        exists: !!list,
        childCount: list?.children.length,
        html: list?.innerHTML,
      },
      currentItem: {
        isEmpty,
        hasSpan: !!listItem.querySelector("span"),
        spanContent: listItem.querySelector("span")?.textContent,
      },
    })

    if (isEmpty) {
      console.log("Empty item - exiting list")
      const p = document.createElement("p")
      p.innerHTML = "<br>"
      list?.parentNode?.insertBefore(p, list.nextSibling)
      listItem.remove()

      if (list && !list.hasChildNodes()) {
        list.remove()
      }

      const newRange = document.createRange()
      newRange.setStart(p, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    } else {
      console.log("Non-empty item - creating new item")
      const newItem = this.createChecklist("")

      const span = listItem.querySelector("span")
      if (span) {
        const spanRange = range.cloneRange()
        if (span.contains(range.startContainer)) {
          spanRange.setStartBefore(span)
        }
        if (span.contains(range.endContainer)) {
          spanRange.setEndAfter(span)
        }

        const afterCursor = span.textContent?.substring(range.endOffset) || ""
        span.textContent = span.textContent?.substring(0, range.startOffset) || ""

        if (afterCursor) {
          const newSpan = newItem.querySelector("span")
          if (newSpan) {
            newSpan.textContent = afterCursor
          }
        }
      }

      if (listItem.nextSibling) {
        list?.insertBefore(newItem, listItem.nextSibling)
      } else {
        list?.appendChild(newItem)
      }

      const newSpan = newItem.querySelector("span")
      if (newSpan) {
        const newRange = document.createRange()
        newRange.setStart(newSpan, 0)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    console.log("Checklist Enter handler completed successfully", {
      newEditorContent: this.editorRef.innerHTML,
      checklistItemCount: this.editorRef.querySelectorAll("ul.checklist li").length,
    })
    console.groupEnd()
    return true
  }
}

