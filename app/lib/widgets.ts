/**
 * Widget types and persistence for Diary of Us dashboard.
 */

export const WIDGET_STORAGE_KEY = "diary-of-us-widgets";

export type WidgetId =
  | "days-together"
  | "countdown"
  | "gesture"
  | "add-widgets";

export type DaysTogetherConfig = {
  startDate: string | null; // ISO date
};

export type CountdownConfig = {
  eventName: string;
  eventDate: string; // ISO date
} | null;

export type GestureConfig = {
  variant: "him" | "her";
};

export type WidgetConfigs = {
  "days-together": DaysTogetherConfig;
  "countdown": CountdownConfig;
  gesture: GestureConfig;
  "add-widgets": Record<string, never>;
};

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "days-together",
  "countdown",
  "gesture",
  "add-widgets",
];

export const DEFAULT_CONFIGS: WidgetConfigs = {
  "days-together": { startDate: null },
  countdown: null,
  gesture: { variant: "him" },
  "add-widgets": {},
};

export function loadWidgetState(): {
  order: WidgetId[];
  configs: WidgetConfigs;
} {
  if (typeof window === "undefined") {
    return { order: DEFAULT_WIDGET_ORDER, configs: DEFAULT_CONFIGS };
  }
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return { order: DEFAULT_WIDGET_ORDER, configs: DEFAULT_CONFIGS };
    const data = JSON.parse(raw) as {
      order?: WidgetId[];
      configs?: Partial<WidgetConfigs>;
    };
    return {
      order: Array.isArray(data.order) ? data.order : DEFAULT_WIDGET_ORDER,
      configs: { ...DEFAULT_CONFIGS, ...data.configs },
    };
  } catch {
    return { order: DEFAULT_WIDGET_ORDER, configs: DEFAULT_CONFIGS };
  }
}

export function saveWidgetState(order: WidgetId[], configs: WidgetConfigs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      WIDGET_STORAGE_KEY,
      JSON.stringify({ order, configs }),
    );
  } catch {
    // ignore
  }
}

/** Period index that changes every 3.5 days (for gesture rotation). */
export function getHalfWeekPeriod(): number {
  const msPerHalfWeek = 3.5 * 24 * 60 * 60 * 1000;
  return Math.floor(Date.now() / msPerHalfWeek);
}

/** Pick two items from list in a stable way for the given week (two 3.5-day blocks). */
function pickTwoGesturesForWeek(list: string[], weekIndex: number): [string, string] {
  const clean = list.filter((s) => s.trim().length > 0);
  if (clean.length === 0) return ["Add ideas on the gesture page", "—"];
  if (clean.length === 1) return [clean[0], clean[0]];
  const seed = weekIndex;
  const i = seed % clean.length;
  const j = (seed + Math.floor(clean.length / 2) + 1) % clean.length;
  const a = clean[i];
  const b = i === j ? clean[(j + 1) % clean.length] : clean[j];
  return [a, b];
}

/** Get the gesture to show for the current 3.5-day block and the next one. Same two for the full week. */
export function getGesturesForCurrentAndNext(
  list: string[],
): { current: string; nextUp: string } {
  const period = getHalfWeekPeriod();
  const weekIndex = Math.floor(period / 2);
  const [first, second] = pickTwoGesturesForWeek(list, weekIndex);
  const isFirstHalf = period % 2 === 0;
  return {
    current: isFirstHalf ? first : second,
    nextUp: isFirstHalf ? second : first,
  };
}
