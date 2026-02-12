"use client";

import type {
  CountdownConfig,
  DaysTogetherConfig,
  GestureConfig,
  WidgetConfigs,
  WidgetId,
} from "../lib/widgets";

type Props = {
  widgetId: WidgetId;
  configs: WidgetConfigs;
  onSave: (configs: WidgetConfigs) => void;
  onClose: () => void;
};

export function WidgetEditModal({
  widgetId,
  configs,
  onSave,
  onClose,
}: Props) {
  if (widgetId === "add-widgets") return null;

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (widgetId === "days-together") {
    const config = configs["days-together"];
    const value = config.startDate ?? "";
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={handleBackdrop}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1f3a] p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-semibold text-slate-50">
            First day together
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Pick the date you consider the start of your relationship.
          </p>
          <input
            type="date"
            value={value}
            onChange={(e) =>
              onSave({
                ...configs,
                "days-together": { startDate: e.target.value || null },
              })
            }
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (widgetId === "countdown") {
    const config = configs.countdown ?? {
      eventName: "",
      eventDate: "",
    };
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={handleBackdrop}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1f3a] p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-semibold text-slate-50">
            Next big event
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Wedding, vacation, anniversary — we&apos;ll count down the days.
          </p>
          <input
            type="text"
            placeholder="Event name"
            value={config.eventName}
            onChange={(e) =>
              onSave({
                ...configs,
                countdown: {
                  ...config,
                  eventName: e.target.value,
                },
              })
            }
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <input
            type="date"
            value={config.eventDate}
            onChange={(e) =>
              onSave({
                ...configs,
                countdown: {
                  ...config,
                  eventDate: e.target.value,
                },
              })
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (widgetId === "gesture") {
    const config = configs.gesture;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={handleBackdrop}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1f3a] p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-semibold text-slate-50">
            Small gesture widget
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Choose which list to pull ideas from. We&apos;ll show 2 random
            gestures per week (one every 3.5 days).
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() =>
                onSave({
                  ...configs,
                  gesture: { variant: "him" },
                })
              }
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                config.variant === "him"
                  ? "border-indigo-400/60 bg-indigo-500/20 text-slate-50"
                  : "border-white/10 bg-black/30 text-slate-400 hover:bg-white/5"
              }`}
            >
              ☕ Make him smile
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  ...configs,
                  gesture: { variant: "her" },
                })
              }
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                config.variant === "her"
                  ? "border-indigo-400/60 bg-indigo-500/20 text-slate-50"
                  : "border-white/10 bg-black/30 text-slate-400 hover:bg-white/5"
              }`}
            >
              🌷 Make her smile
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
