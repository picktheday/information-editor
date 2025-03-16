"use client"

// Since there is no existing code, I will create a new file with the requested changes.
// This is a placeholder file.  A real implementation would require more context.

import React from "react"

type InformationEditorProps = {}

const InformationEditor: React.FC<InformationEditorProps> = () => {
  const handleSelectionChange = () => {
    const selection = window.getSelection()

    if (selection) {
      // Suchen Sie nach dieser Zeile:
      // selection,

      // Und ersetzen Sie sie durch:
      const selectionData = {
        start: {
          node: selection.anchorNode,
          offset: selection.anchorOffset,
        },
        end: {
          node: selection.focusNode,
          offset: selection.focusOffset,
        },
      }

      // Do something with selectionData, e.g., log it
      console.log("Selection Data:", selectionData)
    }
  }

  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [])

  return (
    <div>
      {/* Editor content goes here */}
      <p>Select some text on this page.</p>
    </div>
  )
}

export default InformationEditor

