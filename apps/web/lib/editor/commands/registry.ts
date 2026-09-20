/**
 * Command Registry — §73/§74/§75
 * Semua toolbar, shortcut, context menu, command palette pakai command yang sama.
 * Transaction → Document Model → Renderer
 */

export type CommandId =
  | "document.undo"
  | "document.redo"
  | "document.find"
  | "document.replace"
  | "text.bold"
  | "text.italic"
  | "text.underline"
  | "text.strike"
  | "text.superscript"
  | "text.subscript"
  | "text.clearFormatting"
  | "text.fontFamily"
  | "text.fontSize"
  | "text.textColor"
  | "text.highlight"
  | "paragraph.alignLeft"
  | "paragraph.alignCenter"
  | "paragraph.alignRight"
  | "paragraph.justify"
  | "paragraph.indentIncrease"
  | "paragraph.indentDecrease"
  | "paragraph.lineHeight"
  | "list.bullet"
  | "list.numbered"
  | "list.checklist"
  | "insert.image"
  | "insert.table"
  | "insert.link"
  | "insert.pageBreak"
  | "insert.horizontalRule"
  | "insert.repeater"
  | "insert.condition"
  | "insert.componentBinding"
  | "insert.inlineBinding"
  | "view.zoomIn"
  | "view.zoomOut"
  | "view.zoomReset"
  | "view.toggleRuler"
  | "view.togglePageless"

export const SHORTCUTS: Record<string, CommandId> = {
  // Basic §47
  "Mod-z": "document.undo",
  "Mod-Shift-z": "document.redo",
  "Mod-y": "document.redo",
  "Mod-f": "document.find",
  "Mod-h": "document.replace",
  "Mod-p": "document.find", // print fallback
  // Text §48
  "Mod-b": "text.bold",
  "Mod-i": "text.italic",
  "Mod-u": "text.underline",
  "Alt-Shift-5": "text.strike",
  "Mod-.": "text.superscript",
  "Mod-,": "text.subscript",
  "Mod-\\": "text.clearFormatting",
  // Paragraph §49
  "Mod-]": "paragraph.indentIncrease",
  "Mod-[": "paragraph.indentDecrease",
  // Page
  "Ctrl-Enter": "insert.pageBreak",
  "Mod-Enter": "insert.pageBreak",
}

// Reverse map for UI hints
export const COMMAND_SHORTCUTS: Record<CommandId, string[]> = {
  "document.undo": ["Mod-z"],
  "document.redo": ["Mod-Shift-z", "Mod-y"],
  "document.find": ["Mod-f"],
  "document.replace": ["Mod-h"],
  "text.bold": ["Mod-b"],
  "text.italic": ["Mod-i"],
  "text.underline": ["Mod-u"],
  "text.strike": ["Alt-Shift-5"],
  "text.superscript": ["Mod-."],
  "text.subscript": ["Mod-,"],
  "text.clearFormatting": ["Mod-\\"],
  "text.fontFamily": [],
  "text.fontSize": [],
  "text.textColor": [],
  "text.highlight": [],
  "paragraph.alignLeft": [],
  "paragraph.alignCenter": [],
  "paragraph.alignRight": [],
  "paragraph.justify": [],
  "paragraph.indentIncrease": ["Mod-]"],
  "paragraph.indentDecrease": ["Mod-["],
  "paragraph.lineHeight": [],
  "list.bullet": [],
  "list.numbered": [],
  "list.checklist": [],
  "insert.image": [],
  "insert.table": [],
  "insert.link": ["Mod-k"],
  "insert.pageBreak": ["Ctrl-Enter"],
  "insert.horizontalRule": [],
  "insert.repeater": [],
  "insert.condition": [],
  "insert.componentBinding": [],
  "insert.inlineBinding": [],
  "view.zoomIn": [],
  "view.zoomOut": [],
  "view.zoomReset": [],
  "view.toggleRuler": [],
  "view.togglePageless": [],
}

export function getShortcutDisplay(cmd: CommandId): string {
  const keys = COMMAND_SHORTCUTS[cmd]
  if (!keys || keys.length === 0) return ""
  return keys[0].replace("Mod", "Ctrl").replace("Alt", "Alt")
}

/**
 * Execute command on a Tiptap editor instance
 * Returns true if handled
 */
export function execCommand(editor: any, commandId: CommandId, args?: any): boolean {
  if (!editor) return false
  try {
    switch (commandId) {
      case "document.undo": return editor.chain().focus().undo().run()
      case "document.redo": return editor.chain().focus().redo().run()
      case "text.bold": return editor.chain().focus().toggleBold().run()
      case "text.italic": return editor.chain().focus().toggleItalic().run()
      case "text.underline": return (editor.chain().focus() as any).toggleUnderline().run()
      case "text.strike": return editor.chain().focus().toggleStrike().run()
      case "text.superscript": {
        try { return (editor.chain().focus() as any).toggleSuperscript().run() } catch { return false }
      }
      case "text.subscript": {
        try { return (editor.chain().focus() as any).toggleSubscript().run() } catch { return false }
      }
      case "text.clearFormatting": {
        return editor.chain().focus().clearNodes().unsetAllMarks().run()
      }
      case "paragraph.alignLeft": return editor.chain().focus().setTextAlign('left').run()
      case "paragraph.alignCenter": return editor.chain().focus().setTextAlign('center').run()
      case "paragraph.alignRight": return editor.chain().focus().setTextAlign('right').run()
      case "paragraph.justify": return editor.chain().focus().setTextAlign('justify').run()
      case "paragraph.indentIncrease": {
        // Tiptap no native indent; we use custom or fallback
        try { return (editor.chain().focus() as any).updateAttributes('paragraph', { indent: (args?.indent ?? 24) }).run() } catch { return false }
      }
      case "paragraph.indentDecrease": {
        try { return (editor.chain().focus() as any).updateAttributes('paragraph', { indent: 0 }).run() } catch { return false }
      }
      case "list.bullet": return editor.chain().focus().toggleBulletList().run()
      case "list.numbered": return editor.chain().focus().toggleOrderedList().run()
      case "list.checklist": {
        try { return (editor.chain().focus() as any).toggleTaskList().run() } catch { return editor.chain().focus().toggleBulletList().run() }
      }
      case "insert.horizontalRule": return editor.chain().focus().setHorizontalRule().run()
      case "insert.pageBreak": return (editor.chain().focus() as any).setPageBreak().run()
      case "insert.image": {
        if (args?.src) return editor.chain().focus().setImage({ src: args.src }).run()
        return false
      }
      case "insert.link": {
        if (args?.href) return editor.chain().focus().extendMarkRange('link').setLink({ href: args.href }).run()
        return false
      }
      default: return false
    }
  } catch {
    return false
  }
}
