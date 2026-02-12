"use client";

import { getGesturesForCurrentAndNext, type GestureConfig } from "../lib/widgets";
import { WidgetCard } from "./WidgetCard";

type Props = {
  config: GestureConfig;
  gestureLines: string[];
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function GestureWidget({
  config,
  gestureLines,
  onEdit,
  onRemove,
  canRemove,
}: Props) {
  const { current, nextUp } = getGesturesForCurrentAndNext(gestureLines);
  const label =
    config.variant === "him"
      ? "Small gesture to make him smile"
      : "Small gesture to make her smile";

  return (
    <WidgetCard
      title={label}
      emoji={config.variant === "him" ? "☕" : "🌷"}
      onEdit={onEdit}
      onRemove={onRemove}
      canRemove={canRemove}
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-400">
          This 3.5 days: one idea to try
        </p>
        <p className="text-sm font-medium text-slate-100">{current}</p>
        <p className="text-[11px] text-slate-500">
          After that: {nextUp}
        </p>
        <p className="text-[10px] text-slate-500">
          From your &quot;{config.variant === "him" ? "make him smile" : "make her smile"}&quot; page. Edit to switch list.
        </p>
      </div>
    </WidgetCard>
  );
}
