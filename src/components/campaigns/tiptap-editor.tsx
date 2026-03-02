"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Code,
  Eye,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

/**
 * Detect if HTML is complex email template HTML that Tiptap can't handle.
 * Email templates use tables, doctypes, inline styles, etc.
 */
function isComplexHtml(html: string): boolean {
  if (!html) return false;
  const lower = html.toLowerCase();
  return (
    lower.includes("<table") ||
    lower.includes("<!doctype") ||
    lower.includes("<html") ||
    lower.includes("<head") ||
    lower.includes("<style")
  );
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [sourceMode, setSourceMode] = useState(() => isComplexHtml(content));

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
    ],
    content: sourceMode ? "" : content,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (!sourceMode) {
        onChange(ed.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (sourceMode || !editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor, sourceMode]);

  // Source mode: raw HTML textarea
  if (sourceMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Code className="h-3 w-3" />
            HTML source editor
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => {
              if (!isComplexHtml(content)) {
                setSourceMode(false);
                if (editor) {
                  editor.commands.setContent(content, { emitUpdate: false });
                }
              }
            }}
            disabled={isComplexHtml(content)}
            title={
              isComplexHtml(content)
                ? "Complex HTML must be edited in source mode"
                : "Switch to rich text editor"
            }
          >
            <Eye className="h-3 w-3" />
            Visual
          </Button>
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="h-[260px] animate-pulse rounded-md border bg-muted" />
    );
  }

  function handleSetLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  return (
    <div className="overflow-hidden rounded-md border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("bold") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("italic") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}`}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}`}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("bulletList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editor.isActive("link") ? "bg-accent" : ""}`}
          onClick={handleSetLink}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => setSourceMode(true)}
        >
          <Code className="h-3 w-3" />
          Source
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
