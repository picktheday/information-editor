"use client"

export function EditorStyles() {
  return (
    <style jsx global>{`
      :root {
        --red-500: rgb(239 68 68);
        --green-500: rgb(34 197 94);
        --blue-500: rgb(59 130 246);
        --yellow-500: rgb(234 179 8);
        --purple-500: rgb(168 85 247);
        --slate-500: rgb(100 116 139);
        --red-100: #fee2e2;
        --green-100: #dcfce7;
        --blue-100: #dbeafe;
        --yellow-100: #fef9c3;
        --purple-100: #f3e8ff;
        --slate-100: #f1f5f9;
      }

      .editor-content {
        min-height: 200px;
        font-size: 16px;
        line-height: 1.5;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
      }

      /* Blockquote styles */
      .editor-content .editor-blockquote {
        margin: 0.5em 0;
        padding: 0.25em 0.75em;
        border-left: 4px solid var(--border);
        background-color: var(--accent);
        color: var(--accent-foreground);
        font-style: italic;
      }

      /* Separator styles */
      .editor-content .separator-container {
        padding: 0.75em 0;
        cursor: pointer;
        position: relative;
        margin: 0.5em 0;
        transition: all 0.2s ease;
      }

      .editor-content .separator-container:hover {
        background-color: hsl(var(--muted) / 0.3);
        border-radius: 4px;
      }

      .editor-content .separator-container.selected {
        background-color: hsl(var(--muted) / 0.5);
        border-radius: 4px;
        outline: 2px solid hsl(var(--primary));
        outline-offset: -2px;
      }

      /* Separator line styles */
      .editor-content .editor-separator {
        height: 2px;
        background-color: hsl(var(--border));
        opacity: 0.7;
        display: block;
        width: 100%;
        border: none;
        transition: all 0.2s ease;
      }

      .editor-content .separator-container:hover .editor-separator {
        opacity: 1;
      }

      .editor-content .separator-container.selected .editor-separator {
        opacity: 1;
      }

      /* Colored separator styles */
      .editor-content .separator-container.color-red .editor-separator {
        background-color: var(--red-500) !important;
      }

      .editor-content .separator-container.color-green .editor-separator {
        background-color: var(--green-500) !important;
      }

      .editor-content .separator-container.color-blue .editor-separator {
        background-color: var(--blue-500) !important;
      }

      .editor-content .separator-container.color-yellow .editor-separator {
        background-color: var(--yellow-500) !important;
      }

      .editor-content .separator-container.color-purple .editor-separator {
        background-color: var(--purple-500) !important;
      }

      .editor-content .separator-container.color-slate .editor-separator {
        background-color: var(--slate-500) !important;
      }

      /* Separator background colors */
      .editor-content .separator-container.bgcolor-red {
        background-color: var(--red-100) !important;
      }

      .editor-content .separator-container.bgcolor-green {
        background-color: var(--green-100) !important;
      }

      .editor-content .separator-container.bgcolor-blue {
        background-color: var(--blue-100) !important;
      }

      .editor-content .separator-container.bgcolor-yellow {
        background-color: var(--yellow-100) !important;
      }

      .editor-content .separator-container.bgcolor-purple {
        background-color: var(--purple-100) !important;
      }

      .editor-content .separator-container.bgcolor-slate {
        background-color: var(--slate-100) !important;
      }
      /* Existing styles... */

      /* List styles */
      .editor-content ul,
      .editor-content ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }

      .editor-content ul ul,
      .editor-content ol ol,
      .editor-content ul ol,
      .editor-content ol ul {
        margin: 0.25em 0;
      }

      .editor-content ul > li {
        list-style-type: disc;
      }

      .editor-content ul > li > ul > li {
        list-style-type: circle;
      }

      .editor-content ul > li > ul > li > ul > li {
        list-style-type: square;
      }

      .editor-content ol > li {
        list-style-type: decimal;
      }

      .editor-content ol > li > ol > li {
        list-style-type: lower-alpha;
      }

      .editor-content ol > li > ol > li > ol > li {
        list-style-type: lower-roman;
      }

      /* Checklist styles */
      .editor-content ul.checklist {
        list-style: none;
        padding-left: 0;
        margin: 0;
      }

      .editor-content ul.checklist li {
        display: flex;
        align-items: flex-start;
        gap: 0.5em;
        padding: 0;
        min-height: 18px;
        line-height: 1.2;
        margin: 0.25em 0;
      }

      .editor-content ul.checklist li span {
        flex: 1;
        min-width: 0;
        padding: 0;
        word-break: break-word;
        line-height: inherit;
      }

      .editor-content ul.checklist li.checked span {
        color: hsl(var(--muted-foreground));
      }

      /* Checkbox styles */
      .editor-content ul.checklist li input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border: 1px solid hsl(var(--input));
        border-radius: 0.25rem;
        background-color: hsl(var(--background));
        cursor: pointer;
        position: relative;
        margin: 4px 0 0 0;
        transition: all 0.2s ease;
      }

      .editor-content ul.checklist li input[type="checkbox"]:hover {
        border-color: hsl(var(--primary));
      }

      .editor-content ul.checklist li input[type="checkbox"]:checked {
        background-color: hsl(var(--primary));
        border-color: hsl(var(--primary));
      }

      .editor-content ul.checklist li input[type="checkbox"]:checked::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        transition: all 0.2s ease;
      }

      .editor-content ul.checklist li input[type="checkbox"]:focus-visible {
        outline: 2px solid hsl(var(--ring));
        outline-offset: 2px;
      }

      /* Nested list indentation */
      .editor-content li {
        margin: 0.25em 0;
      }

      .editor-content li > ul,
      .editor-content li > ol {
        margin-left: 1em;
      }
    `}</style>
  )
}

