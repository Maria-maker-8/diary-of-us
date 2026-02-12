"use client";

import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  className = "",
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[140px] md:min-h-[180px] w-full px-3.5 py-3 text-sm leading-relaxed text-slate-100 outline-none prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getHTML();
    if (value !== current) editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [value, editor]);

  const updateAndNotify = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    onChange(html);
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", updateAndNotify);
    return () => {
      editor.off("update", updateAndNotify);
    };
  }, [editor, updateAndNotify]);

  if (!editor) return null;

  return (
    <div className={className}>
      <BubbleMenu
        editor={editor}
        className="flex gap-0.5 rounded-lg border border-white/10 bg-[#1a1f3a] p-1 shadow-lg"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-xs font-medium transition ${
            editor.isActive("bold")
              ? "bg-white/20 text-slate-100"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-xs italic transition ${
            editor.isActive("italic")
              ? "bg-white/20 text-slate-100"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded px-2 py-1 text-xs underline transition ${
            editor.isActive("underline")
              ? "bg-white/20 text-slate-100"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
          }`}
        >
          U
        </button>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
