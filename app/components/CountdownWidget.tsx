"use client";

import type { CountdownConfig } from "../lib/widgets";
import { WidgetCard } from "./WidgetCard";

type Props = {
  config: CountdownConfig;
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

export function CountdownWidget({
  config,
  onEdit,
  onRemove,
  canRemove,
}: Props) {
  const eventName = typeof config?.eventName === "string" ? config.eventName : "";
  const eventDate = typeof config?.eventDate === "string" ? config.eventDate : "";
  const hasEvent = eventName.trim().length > 0 && eventDate.length > 0;
  const days = hasEvent ? daysUntil(eventDate) : 0;

  return (
    <WidgetCard
      title="Days until the next big event"
      emoji="✨"
      onEdit={onEdit}
      onRemove={onRemove}
      canRemove={canRemove}
    >
      <div className="flex flex-col gap-1">
        {hasEvent ? (
          <>
            <p className="text-2xl font-semibold tabular-nums text-slate-50 md:text-3xl">
              {days.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
            days until {eventName}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Tap Edit to add a vacation, wedding, or milestone.
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
