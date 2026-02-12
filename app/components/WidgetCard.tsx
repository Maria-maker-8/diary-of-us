"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  emoji?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  children: ReactNode;
  className?: string;
};

export function WidgetCard({
  title,
  emoji,
  onEdit,
  onRemove,
  canRemove = false,
  children,
  className = "",
}: Props) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[rgba(14,20,64,0.98)] via-[rgba(15,19,58,0.98)] to-[rgba(10,14,39,0.98)] p-4 shadow-[0_18px_60px_rgba(15,23,42,0.85)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,_rgba(91,108,255,0.65),transparent_70%)]" />
        <div className="absolute -bottom-20 -right-12 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,179,255,0.6),transparent_70%)]" />
      </div>

      <div className="relative flex flex-col gap-3">
        <header className="flex items-center justify-between gap-2">
          <h2 className="flex max-w-[80%] items-center gap-2 text-sm font-semibold tracking-tight text-slate-50">
            {emoji && <span className="text-lg">{emoji}</span>}
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {canRemove && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-rose-300"
                aria-label="Remove widget"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-200 transition hover:bg-white/10"
              >
                Edit
              </button>
            )}
          </div>
        </header>
        {children}
      </div>
    </article>
  );
}
