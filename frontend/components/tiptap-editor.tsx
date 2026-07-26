"use client"

import ColorExtension from "@tiptap/extension-color"
import HighlightExtension from "@tiptap/extension-highlight"
import ImageExtension from "@tiptap/extension-image"
import LinkExtension from "@tiptap/extension-link"
import PlaceholderExtension from "@tiptap/extension-placeholder"
import SubscriptExtension from "@tiptap/extension-subscript"
import SuperscriptExtension from "@tiptap/extension-superscript"
import {
  TableCell as TableCellExtension,
  Table as TableExtension,
  TableHeader as TableHeaderExtension,
  TableRow as TableRowExtension,
} from "@tiptap/extension-table"
import TextAlignExtension from "@tiptap/extension-text-align"
import { TextStyle as TextStyleExtension } from "@tiptap/extension-text-style"
import UnderlineExtension from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Type,
  Underline,
  Undo2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface TipTapEditorProps {
  content: string
  onChange?: (html: string) => void
  editable?: boolean
  className?: string
}

// ─── Colour palettes ─────────────────────────────────────────────────────────

const TEXT_COLORS = [
  { label: "Default", value: undefined },
  { label: "Gray", value: "#6b7280" },
  { label: "Brown", value: "#92400e" },
  { label: "Orange", value: "#ea580c" },
  { label: "Yellow", value: "#ca8a04" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Pink", value: "#db2777" },
  { label: "Red", value: "#dc2626" },
]

const HIGHLIGHT_COLORS = [
  { label: "Default", value: undefined },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
]

// ─── Shared editor extensions (stable reference) ────────────────────────────

function createExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: false,
      underline: false,
    }),
    UnderlineExtension,
    LinkExtension.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    ImageExtension.configure({ inline: false }),
    TextAlignExtension.configure({ types: ["heading", "paragraph"] }),
    HighlightExtension.configure({ multicolor: true }),
    TableExtension.configure({ resizable: true }),
    TableRowExtension,
    TableCellExtension,
    TableHeaderExtension,
    SubscriptExtension,
    SuperscriptExtension,
    TextStyleExtension,
    ColorExtension,
    PlaceholderExtension.configure({
      placeholder: "Tulis konten artikel di sini…",
    }),
  ]
}

// ─── Toolbar helpers ─────────────────────────────────────────────────────────

function ToolbarDivider() {
  return (
    <Separator
      orientation="vertical"
      className="mx-0.5 h-6 shrink-0 translate-y-1 bg-input"
    />
  )
}

function ToolbarToggle({
  pressed,
  onPressedChange,
  label,
  disabled,
  children,
}: {
  pressed: boolean
  onPressedChange: () => void
  label: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

function ToolbarButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

// ─── Table grid popover ─────────────────────────────────────────────────────

const MAX_TABLE_ROWS = 8
const MAX_TABLE_COLS = 8

function TableGridPopover({
  onInsert,
}: {
  onInsert: (rows: number, cols: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState({ rows: 1, cols: 1 })

  const handleSelect = () => {
    onInsert(hover.rows, hover.cols)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Tabel">
          <Table />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-2">
        <div className="mb-1.5 text-center text-xs text-muted-foreground">
          {hover.rows} &times; {hover.cols}
        </div>
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${MAX_TABLE_COLS}, 16px)`,
          }}
        >
          {Array.from({ length: MAX_TABLE_ROWS * MAX_TABLE_COLS }, (_, i) => {
            const row = Math.floor(i / MAX_TABLE_COLS) + 1
            const col = (i % MAX_TABLE_COLS) + 1
            const isActive = row <= hover.rows && col <= hover.cols
            return (
              <button
                key={`${row}-${col}`}
                type="button"
                className={cn(
                  "size-4 rounded-sm border transition-colors",
                  isActive
                    ? "border-primary bg-primary/20"
                    : "border-muted-foreground/20 bg-transparent hover:border-muted-foreground/40"
                )}
                onMouseEnter={() => setHover({ rows: row, cols: col })}
                onClick={handleSelect}
                aria-label={`${row} baris ${col} kolom`}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Colour picker popover ───────────────────────────────────────────────────

function ColorPickerPopover({
  colors,
  label,
  icon,
  onSelect,
  currentColor,
}: {
  colors: Array<{ label: string; value: string | undefined }>
  label: string
  icon: React.ReactNode
  onSelect: (color: string | undefined) => void
  currentColor?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={label}>
              {icon}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-fit p-2">
        <div className="grid grid-cols-5 gap-1">
          {colors.map((color) => (
            <Tooltip key={color.label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "size-6 rounded-md border transition-all hover:scale-110",
                    color.value === currentColor
                      ? "ring-2 ring-primary ring-offset-1"
                      : "border-muted-foreground/20"
                  )}
                  style={{
                    backgroundColor: color.value ?? "transparent",
                    ...(color.value === undefined
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg, transparent 45%, #dc2626 45%, #dc2626 55%, transparent 55%)",
                        }
                      : {}),
                  }}
                  onClick={() => {
                    onSelect(color.value)
                    setOpen(false)
                  }}
                  aria-label={color.label}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">{color.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Link dialog ─────────────────────────────────────────────────────────────

function LinkDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const previousUrl = editor.getAttributes("link").href ?? ""
  const [url, setUrl] = useState(previousUrl)

  useEffect(() => {
    if (open) {
      setUrl(editor.getAttributes("link").href ?? "")
    }
  }, [editor, open])

  const handleSubmit = useCallback(() => {
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      const href = url.trim().startsWith("http")
        ? url.trim()
        : `https://${url.trim()}`
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    onOpenChange(false)
  }, [editor, url, onOpenChange])

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    onOpenChange(false)
  }, [editor, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tautan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://contoh.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between">
          <Button variant="outline" onClick={handleRemove}>
            Hapus tautan
          </Button>
          <Button onClick={handleSubmit} disabled={url.trim() === ""}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Image dialog ────────────────────────────────────────────────────────────

function ImageDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")

  useEffect(() => {
    if (!open) {
      setUrl("")
      setAlt("")
    }
  }, [open])

  const handleSubmit = useCallback(() => {
    if (url.trim()) {
      editor
        .chain()
        .focus()
        .setImage({ src: url.trim(), alt: alt.trim() })
        .run()
      onOpenChange(false)
    }
  }, [editor, url, alt, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sisipkan Gambar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="image-url">URL Gambar</Label>
            <Input
              id="image-url"
              placeholder="https://contoh.com/gambar.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-alt">Teks Alternatif</Label>
            <Input
              id="image-alt"
              placeholder="Deskripsi gambar"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={url.trim() === ""}>
            Sisipkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

// ─── Main component ──────────────────────────────────────────────────────────

export function TipTapEditor({
  content,
  onChange,
  editable = false,
  className,
}: TipTapEditorProps) {
  const extensions = useMemo(() => createExtensions(), [])
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    extensions,
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-pre:rounded-lg prose-pre:bg-muted prose-pre:text-foreground prose-img:max-h-80 prose-img:rounded-lg prose-hr:my-6 prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-0.5 prose-blockquote:pr-4 prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-muted-foreground prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-lg prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-tr:border-b prose-tr:border-border min-h-[250px] w-full max-w-none px-4 py-3 outline-none cursor-text [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
  })

  // Sync editable prop to editor without destroying/re-creating it
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // ── Read-only mode ────────────────────────────────────────────────────
  if (!editable) {
    return (
      <div
        className={cn(
          "prose prose-sm field-sizing-content max-h-96 min-h-16 w-full max-w-none overflow-y-auto rounded-lg border border-input p-4 text-base leading-relaxed transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:prose-invert dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 prose-headings:font-medium prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-lg prose-tr:border-b prose-tr:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-img:max-h-80 prose-img:rounded-lg",
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  if (!editor) {
    return (
      <div
        className={cn(
          "flex min-h-[250px] items-center justify-center rounded-lg border border-input",
          className
        )}
      >
        <span className="text-sm text-muted-foreground">Memuat editor…</span>
      </div>
    )
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  const text = editor.state.doc.textContent
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-input",
          className
        )}
      >
        {/* ── Toolbar ───────────────────────────────────────── */}
        <ToolbarContent
          editor={editor}
          setLinkDialogOpen={setLinkDialogOpen}
          setImageDialogOpen={setImageDialogOpen}
        />

        {/* ── Editor body ───────────────────────────────────── */}
        <EditorContent editor={editor} />

        {/* ── Stats bar ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            {wordCount.toLocaleString("id-ID")} kata
          </span>
          <span>{charCount.toLocaleString("id-ID")} karakter</span>
          <span className="grow" />
          <span>~{readingTime} menit baca</span>
        </div>

        {/* ── Dialogs ───────────────────────────────────────── */}
        <LinkDialog
          editor={editor}
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
        />
        <ImageDialog
          editor={editor}
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── ToolbarContent (separate component to use editor state) ────────────────

function ToolbarContent({
  editor,
  setLinkDialogOpen,
  setImageDialogOpen,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  setLinkDialogOpen: (open: boolean) => void
  setImageDialogOpen: (open: boolean) => void
}) {
  const isLinkActive = editor.isActive("link")
  const currentColor = editor.getAttributes("textStyle").color
  const currentHighlight = editor.getAttributes("highlight").color

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-input p-1 dark:bg-muted">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        label="Undo"
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        label="Redo"
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarToggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        label="Tebal"
      >
        <Bold />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        label="Miring"
      >
        <Italic />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        label="Garis bawah"
      >
        <Underline />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        label="Coret"
      >
        <Strikethrough />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        label="Kode inline"
      >
        <Code />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Subscript / Superscript */}
      <ToolbarToggle
        pressed={editor.isActive("subscript")}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        label="Subskrip"
      >
        <Subscript />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("superscript")}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
        label="Superskrip"
      >
        <Superscript />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarToggle
        pressed={editor.isActive("paragraph")}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        label="Paragraf"
      >
        <Type />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        label="Heading 1"
      >
        <Heading1 />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        label="Heading 2"
      >
        <Heading2 />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        label="Heading 3"
      >
        <Heading3 />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("heading", { level: 4 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 4 }).run()
        }
        label="Heading 4"
      >
        <Heading4 />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarToggle
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        label="Daftar tidak berurut"
      >
        <List />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        label="Daftar berurut"
      >
        <ListOrdered />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Blocks */}
      <ToolbarToggle
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        label="Kutipan"
      >
        <Quote />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("codeBlock")}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        label="Blok kode"
      >
        <Code />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        label="Rata kiri"
      >
        <AlignLeft />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        label="Rata tengah"
      >
        <AlignCenter />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        label="Rata kanan"
      >
        <AlignRight />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "justify" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
        label="Rata kanan-kiri"
      >
        <AlignJustify />
      </ToolbarToggle>

      <ToolbarDivider />

      {/* Insert */}
      <ToolbarButton
        onClick={() => {
          if (isLinkActive) {
            editor.chain().focus().extendMarkRange("link").run()
          }
          setLinkDialogOpen(true)
        }}
        label="Tautan"
      >
        <Link />
      </ToolbarButton>

      <ToolbarButton onClick={() => setImageDialogOpen(true)} label="Gambar">
        <Image />
      </ToolbarButton>

      <TableGridPopover
        onInsert={(rows, cols) =>
          editor
            .chain()
            .focus()
            .insertTable({ rows, cols, withHeaderRow: true })
            .run()
        }
      />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Garis horizontal"
      >
        <Minus />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Highlight & Color */}
      <ColorPickerPopover
        colors={HIGHLIGHT_COLORS}
        label="Sorotan"
        icon={<Highlighter />}
        currentColor={currentHighlight}
        onSelect={(color) => {
          if (color) {
            editor.chain().focus().setHighlight({ color }).run()
          } else {
            editor.chain().focus().unsetHighlight().run()
          }
        }}
      />
      <ColorPickerPopover
        colors={TEXT_COLORS}
        label="Warna teks"
        icon={<Palette />}
        currentColor={currentColor}
        onSelect={(color) => {
          if (color) {
            editor.chain().focus().setColor(color).run()
          } else {
            editor.chain().focus().unsetColor().run()
          }
        }}
      />

      <ToolbarDivider />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        label="Hapus format"
      >
        <RemoveFormatting />
      </ToolbarButton>
    </div>
  )
}
