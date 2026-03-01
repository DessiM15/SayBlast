"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";
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
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
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
    content,
    editable: true,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

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
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
