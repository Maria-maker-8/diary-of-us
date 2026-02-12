"use client";

import type { WidgetId } from "../lib/widgets";
import { WidgetCard } from "./WidgetCard";

const RESTORABLE: { id: WidgetId; label: string }[] = [
  { id: "days-together", label: "Days together" },
  { id: "countdown", label: "Countdown" },
  { id: "gesture", label: "Small gesture" },
];

type Props = {
  currentOrder: WidgetId[];
  onRestore?: (id: WidgetId) => void;
};

export function AddWidgetsPlaceholder({
  currentOrder,
  onRestore,
}: Props) {
  const missing = RESTORABLE.filter((r) => !currentOrder.includes(r.id));

  return (
    <WidgetCard title="Add widgets" emoji="➕">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-400">
          More widgets coming: image highlight, remember when, suggested
          activity.
        </p>
        {missing.length > 0 && onRestore && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {missing.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onRestore(id)}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200 ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
              >
                + {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
