"use client";

import type { DaysTogetherConfig } from "../lib/widgets";
import { WidgetCard } from "./WidgetCard";

type Props = {
  config: DaysTogetherConfig;
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

function daysSince(dateStr: string): number {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

export function DaysTogetherWidget({
  config,
  onEdit,
  onRemove,
  canRemove,
}: Props) {
  const startDate = config.startDate?.trim();
  const hasDate = !!startDate;
  const days = hasDate ? daysSince(startDate) : 0;
  const label = hasDate
    ? "days since you're together"
    : "Set your first day to start counting";

  return (
    <WidgetCard
      title="Days since we're together"
      emoji="💕"
      onEdit={onEdit}
      onRemove={onRemove}
      canRemove={canRemove}
    >
      <div className="flex flex-col gap-1">
        {hasDate ? (
          <>
            <p className="text-2xl font-semibold tabular-nums text-slate-50 md:text-3xl">
              {days.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">{label}</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Tap Edit to choose the first day of your relationship.
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
