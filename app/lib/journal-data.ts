import { supabase } from "./supabase";
import type { WidgetConfigs, WidgetId } from "./widgets";
import { DEFAULT_CONFIGS, DEFAULT_WIDGET_ORDER } from "./widgets";

export type PageRow = {
  id: string;
  journal_id: string;
  slug: string;
  emoji: string;
  title: string;
  hint: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type PageForApp = {
  id: string;
  supabaseId: string;
  emoji: string;
  title: string;
  hint: string;
  content: string;
};

export async function fetchPages(
  journalId: string,
): Promise<PageForApp[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, emoji, title, hint, content")
    .eq("journal_id", journalId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.slug,
    supabaseId: row.id,
    emoji: row.emoji ?? "📝",
    title: row.title,
    hint: row.hint ?? "",
    content: row.content ?? "",
  }));
}

export async function insertPage(
  journalId: string,
  slug: string,
  emoji: string,
  title: string,
  hint: string,
): Promise<PageForApp | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pages")
    .insert({
      journal_id: journalId,
      slug,
      emoji,
      title,
      hint,
      content: "",
    })
    .select("id, slug, emoji, title, hint, content")
    .single();
  if (error || !data) return null;
  return {
    id: data.slug,
    supabaseId: data.id,
    emoji: data.emoji ?? "📝",
    title: data.title,
    hint: data.hint ?? "",
    content: data.content ?? "",
  };
}

export async function updatePageContent(
  supabasePageId: string,
  content: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("pages")
    .update({ content })
    .eq("id", supabasePageId);
  return !error;
}

export async function updatePageMeta(
  supabasePageId: string,
  updates: { emoji?: string; title?: string; hint?: string },
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", supabasePageId);
  return !error;
}

export async function deletePage(supabasePageId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pages").delete().eq("id", supabasePageId);
  return !error;
}

export async function fetchWidgets(
  journalId: string,
): Promise<{ order: WidgetId[]; configs: WidgetConfigs } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("widgets")
    .select("widget_key, config, position")
    .eq("journal_id", journalId)
    .order("position", { ascending: true });
  if (error) return null;
  const order = (data ?? []).map((r) => r.widget_key as WidgetId);
  const configs = { ...DEFAULT_CONFIGS };
  (data ?? []).forEach((r) => {
    const key = r.widget_key as keyof WidgetConfigs;
    if (key in configs && r.config != null) {
      (configs as Record<string, unknown>)[key] = r.config;
    }
  });
  if (order.length === 0) return { order: DEFAULT_WIDGET_ORDER, configs: DEFAULT_CONFIGS };
  return { order, configs };
}

export async function saveWidgets(
  journalId: string,
  order: WidgetId[],
  configs: WidgetConfigs,
): Promise<boolean> {
  if (!supabase) return false;
  const rows = order.map((widget_key, position) => ({
    journal_id: journalId,
    widget_key,
    config: configs[widget_key as keyof WidgetConfigs] ?? {},
    position,
  }));
  const { error: delErr } = await supabase
    .from("widgets")
    .delete()
    .eq("journal_id", journalId);
  if (delErr) return false;
  const { error: insErr } = await supabase.from("widgets").insert(rows);
  return !insErr;
}

/** Extract plain-text lines from TipTap HTML for gesture list. */
export function htmlContentToLines(html: string): string[] {
  if (!html || !html.trim()) return [];
  const text = html
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export const DEFAULT_PAGE_SEEDS = [
  { slug: "things-shell-never-forget", emoji: "💝", title: "Things she'll never forget", hint: "Tiny moments, big feelings – the things she lights up remembering." },
  { slug: "things-hell-never-forget", emoji: "💙", title: "Things he'll never forget", hint: "Compliments, surprises, or quiet gestures that stay with him." },
  { slug: "gesture-make-him-smile", emoji: "☕", title: "Small gesture to make him smile", hint: "His kind of coffee, his favorite snack, or a note on his pillow." },
  { slug: "gesture-make-her-smile", emoji: "🌷", title: "Small gesture to make her smile", hint: "Her flowers, her playlist, or a reminder that you really see her." },
  { slug: "coffee-shops-top", emoji: "☕", title: "Our coffee shops top", hint: "Keep track of every cozy corner and perfect cappuccino together." },
  { slug: "adventures-2026", emoji: "✈️", title: "Adventures for 2026", hint: "Dream aloud about the trips, weekends, and tiny adventures you want." },
  { slug: "barcelona-trip", emoji: "🇪🇸", title: "Barcelona trip", hint: "Plan each day, from morning café con leche to late-night walks." },
  { slug: "dont-forget", emoji: "⏰", title: "Don't forget to...", hint: "A gentle queue of reminders so nothing important slips away." },
];

export async function seedDefaultPages(
  journalId: string,
): Promise<PageForApp[]> {
  if (!supabase) return [];
  const existing = await fetchPages(journalId);
  if (existing.length > 0) return existing;
  const inserted: PageForApp[] = [];
  for (const seed of DEFAULT_PAGE_SEEDS) {
    const page = await insertPage(
      journalId,
      seed.slug,
      seed.emoji,
      seed.title,
      seed.hint,
    );
    if (page) inserted.push(page);
  }
  return inserted;
}
