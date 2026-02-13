"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPages,
  fetchWidgets,
  htmlContentToLines,
  insertPage,
  saveWidgets,
  seedDefaultPages,
  updatePageContent,
  deletePage as deletePageApi,
} from "./lib/journal-data";
import {
  loadWidgetState,
  saveWidgetState,
  type WidgetConfigs,
  type WidgetId,
} from "./lib/widgets";
import { AddWidgetsPlaceholder } from "./components/AddWidgetsPlaceholder";
import { CountdownWidget } from "./components/CountdownWidget";
import { DaysTogetherWidget } from "./components/DaysTogetherWidget";
import { GestureWidget } from "./components/GestureWidget";
import { RichTextEditor } from "./components/RichTextEditor";
import { WidgetEditModal } from "./components/WidgetEditModal";
import { useAuth } from "./contexts/AuthContext";
import { hasSupabase } from "./lib/supabase";

type Page = {
  id: string;
  supabaseId?: string;
  emoji: string;
  title: string;
  hint: string;
  content: string;
};

const LOCAL_DEFAULT_PAGES: Omit<Page, "content">[] = [
  { id: "things-shell-never-forget", emoji: "💝", title: "Things she'll never forget", hint: "Tiny moments, big feelings – the things she lights up remembering." },
  { id: "things-hell-never-forget", emoji: "💙", title: "Things he'll never forget", hint: "Compliments, surprises, or quiet gestures that stay with him." },
  { id: "gesture-make-him-smile", emoji: "☕", title: "Small gesture to make him smile", hint: "His kind of coffee, his favorite snack, or a note on his pillow." },
  { id: "gesture-make-her-smile", emoji: "🌷", title: "Small gesture to make her smile", hint: "Her flowers, her playlist, or a reminder that you really see her." },
  { id: "coffee-shops-top", emoji: "☕", title: "Our coffee shops top", hint: "Keep track of every cozy corner and perfect cappuccino together." },
  { id: "adventures-2026", emoji: "✈️", title: "Adventures for 2026", hint: "Dream aloud about the trips, weekends, and tiny adventures you want." },
  { id: "barcelona-trip", emoji: "🇪🇸", title: "Barcelona trip", hint: "Plan each day, from morning café con leche to late-night walks." },
  { id: "dont-forget", emoji: "⏰", title: "Don't forget to...", hint: "A gentle queue of reminders so nothing important slips away." },
];

export default function Home() {
  const auth = useAuth();
  const journalId = auth?.journalId ?? null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([]);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfigs | null>(null);
  const [editingWidgetId, setEditingWidgetId] = useState<WidgetId | null>(null);

  useEffect(() => {
    const { order, configs } = loadWidgetState();
    setWidgetOrder(order);
    setWidgetConfigs(configs);
  }, []);

  useEffect(() => {
    if (widgetConfigs === null || widgetOrder.length === 0) return;
  
    // Always keep a local copy so widgets persist for this browser,
    // even if Supabase is not configured or the user is signed out.
    saveWidgetState(widgetOrder, widgetConfigs);
  
    // If we have a journal in Supabase, mirror the widget state there too.
    if (journalId && hasSupabase) {
      saveWidgets(journalId, widgetOrder, widgetConfigs).catch(() => {});
    }
  }, [journalId, widgetOrder, widgetConfigs]);

  useEffect(() => {
    if (!journalId) return;
    let cancelled = false;
    (async () => {
      const existingPages = await fetchPages(journalId);
      if (cancelled) return;
      const pagesData = existingPages.length > 0 ? existingPages : await seedDefaultPages(journalId);
      if (cancelled) return;
      const widgetsData = await fetchWidgets(journalId);
      if (cancelled) return;
      setPages(pagesData.map((p) => ({ ...p, hint: p.hint ?? "" })));
      if (pagesData[0]) setSelectedPageId(pagesData[0].id);
      if (widgetsData) {
        setWidgetOrder((prev) => (prev.length > 0 ? prev : widgetsData.order));
     setWidgetConfigs((prev) => (prev ?? widgetsData.configs));
   }
    })();
    return () => { cancelled = true; };
  }, [journalId]);

  const handleWidgetConfigChange = (next: WidgetConfigs) => {
    setWidgetConfigs(next);
  };

  const handleRemoveWidget = (id: WidgetId) => {
    if (id === "add-widgets") return;
    setWidgetOrder((prev) => prev.filter((w) => w !== id));
  };

  const handleMoveWidget = (id: WidgetId, direction: "up" | "down") => {
    setWidgetOrder((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      if (direction === "up" && i === 0) return prev;
      if (direction === "down" && i === prev.length - 1) return prev;
      const next = [...prev];
      const j = direction === "up" ? i - 1 : i + 1;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const [pages, setPages] = useState<Page[]>(() =>
    LOCAL_DEFAULT_PAGES.map((p) => ({ ...p, content: "" })),
  );
  const [selectedPageId, setSelectedPageId] = useState<string>(
    LOCAL_DEFAULT_PAGES[0]?.id ?? "",
  );

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId) ?? pages[0],
    [pages, selectedPageId],
  );

  const handleAddPage = useCallback(async () => {
    const slug = `page-${Date.now()}`;
    if (journalId) {
      const newPage = await insertPage(
        journalId,
        slug,
        "📝",
        "Untitled page",
        "Start a fresh page for a new memory, list, or adventure.",
      );
      if (newPage) {
        setPages((prev) => [...prev, newPage]);
        setSelectedPageId(newPage.id);
        setSidebarOpen(false);
      }
      return;
    }
    const newPage: Page = {
      id: slug,
      emoji: "📝",
      title: "Untitled page",
      hint: "Start a fresh page for a new memory, list, or adventure.",
      content: "",
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedPageId(newPage.id);
    setSidebarOpen(false);
  }, [journalId]);

  const handleDeleteCurrentPage = useCallback(async () => {
    if (!selectedPage || pages.length <= 1) return;
    if (selectedPage.supabaseId) {
      await deletePageApi(selectedPage.supabaseId);
    }
    setPages((prev) => prev.filter((p) => p.id !== selectedPage.id));
    const remaining = pages.filter((p) => p.id !== selectedPage.id);
    if (remaining[0]) setSelectedPageId(remaining[0].id);
  }, [selectedPage, pages]);

  const saveContentRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUpdateContent = useCallback(
    (pageId: string, content: string) => {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, content } : p)),
      );
      const page = pages.find((p) => p.id === pageId);
      if (page?.supabaseId && journalId) {
        if (saveContentRef.current) clearTimeout(saveContentRef.current);
        saveContentRef.current = setTimeout(() => {
          updatePageContent(page.supabaseId!, content).finally(() => {
            saveContentRef.current = null;
          });
        }, 600);
      }
    },
    [journalId, pages],
  );

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-100">
      {/* Top bar for mobile */}
      <header className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setSidebarOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-sm"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <span className="block h-[1px] w-4 bg-slate-200" />
            <span className="mt-[3px] block h-[1px] w-3 bg-slate-400" />
            <span className="mt-[3px] block h-[1px] w-2 bg-slate-600" />
          </span>
          Pages
        </button>
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Diary of Us
          </span>
          <span className="text-[11px] text-slate-500">our shared space</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-black/50 px-4 py-4 backdrop-blur-xl transition-transform duration-200 ease-out md:static md:translate-x-0 md:bg-black/30 md:px-5 md:py-6 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-4 md:pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-lg">💫</span>
                <span className="text-xs font-medium tracking-wide text-slate-200">
                  Diary of Us
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                A quiet place for just the two of you.
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full border border-white/10 bg-black/40 p-1.5 text-slate-300 md:hidden"
              aria-label="Close sidebar"
            >
              <span className="block h-[1px] w-3 rotate-45 bg-slate-200" />
              <span className="-mt-[1px] block h-[1px] w-3 -rotate-45 bg-slate-200" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Pages
              </p>
              <ul className="space-y-1.5">
                {pages.map((page) => {
                  const isActive = page.id === selectedPage?.id;
                  return (
                    <li key={page.id}>
                      <button
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setSidebarOpen(false);
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm text-slate-100 shadow-sm transition ${
                          isActive
                            ? "border-[rgba(148,163,255,0.9)] bg-gradient-to-r from-[rgba(31,41,105,0.95)] to-[rgba(30,64,175,0.9)]"
                            : "border-white/5 bg-gradient-to-r from-[rgba(16,24,64,0.9)] to-[rgba(18,24,56,0.85)] hover:border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-lg leading-none">{page.emoji}</span>
                        <span className="flex-1 truncate">{page.title}</span>
                        <span
                          className={`text-[10px] uppercase tracking-[0.22em] ${
                            isActive
                              ? "text-slate-100"
                              : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        >
                          {isActive ? "open" : "open"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              onClick={handleAddPage}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-500/35 bg-transparent px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-300 hover:bg-white/5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300/10 text-base text-slate-100">
                +
              </span>
              New page
            </button>
          </nav>

          <div className="mt-4 border-t border-white/5 pt-3 text-[11px] text-slate-500">
            {hasSupabase && auth?.user ? (
              <>
                <p>{auth.user.email}</p>
                <div className="mt-1.5">
                  <p className="text-slate-400">Share with partner</p>
                  {auth.inviteCode ? (
                    <p className="mt-0.5">
                      Invite code: <span className="font-mono font-semibold text-slate-200">{auth.inviteCode}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-slate-500">
                      {auth.journalId ? "Loading code…" : "…"}
                      <button
                        type="button"
                        onClick={() => auth.refreshInviteCode()}
                        className="ml-1.5 text-indigo-300 hover:text-indigo-200"
                      >
                        Get code
                      </button>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => auth.signOut()}
                  className="mt-2 text-rose-300/90 hover:text-rose-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <p className="mt-0.5">Use the app locally. Add Supabase to save and share.</p>
            )}
          </div>
        </aside>

        {/* Backdrop for mobile when sidebar is open */}
        {sidebarOpen && (
          <button
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
        )}

        {/* Main content / dashboard */}
        <main className="relative z-0 flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:gap-8">
            <header className="hidden items-center justify-between md:flex">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                  Diary of Us
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Your shared home for memories, tiny gestures, and future plans.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-medium text-slate-300">
                  Today&apos;s vibe
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Start with a page, then pin your favorite widgets.
                </p>
              </div>
            </header>

            {/* Dashboard intro (mobile) */}
            <div className="md:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Dashboard
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">
                Diary of Us
              </h1>
              <p className="mt-1.5 text-xs text-slate-400">
                A quick glimpse at your story so far.
              </p>
            </div>

            {/* Widget grid */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Dashboard widgets
                </p>
              </div>

              {widgetConfigs === null ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/8 bg-[#1a1f3a]/80 p-4 animate-pulse"
                    >
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-full rounded bg-white/5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {widgetOrder.map((widgetId, index) => {
                    const canMoveUp = index > 0;
                    const canMoveDown = index < widgetOrder.length - 1;
                    const isRemovable =
                      widgetId !== "add-widgets" && widgetOrder.length > 1;

                    if (widgetId === "days-together") {
                      return (
                        <div key={widgetId} className="relative">
                          <DaysTogetherWidget
                            config={widgetConfigs["days-together"]}
                            onEdit={() => setEditingWidgetId("days-together")}
                            onRemove={() => handleRemoveWidget("days-together")}
                            canRemove={isRemovable}
                          />
                          <WidgetReorderButtons
                            onMoveUp={() => handleMoveWidget(widgetId, "up")}
                            onMoveDown={() =>
                              handleMoveWidget(widgetId, "down")
                            }
                            canMoveUp={canMoveUp}
                            canMoveDown={canMoveDown}
                          />
                        </div>
                      );
                    }
                    if (widgetId === "countdown") {
                      return (
                        <div key={widgetId} className="relative">
                          <CountdownWidget
                            config={widgetConfigs.countdown}
                            onEdit={() => setEditingWidgetId("countdown")}
                            onRemove={() => handleRemoveWidget("countdown")}
                            canRemove={isRemovable}
                          />
                          <WidgetReorderButtons
                            onMoveUp={() => handleMoveWidget(widgetId, "up")}
                            onMoveDown={() =>
                              handleMoveWidget(widgetId, "down")
                            }
                            canMoveUp={canMoveUp}
                            canMoveDown={canMoveDown}
                          />
                        </div>
                      );
                    }
                    if (widgetId === "gesture") {
                      const gesturePageId =
                        widgetConfigs.gesture.variant === "him"
                          ? "gesture-make-him-smile"
                          : "gesture-make-her-smile";
                      const gesturePage = pages.find(
                        (p) => p.id === gesturePageId,
                      );
                      const gestureLines = htmlContentToLines(
                        gesturePage?.content ?? "",
                      );

                      return (
                        <div key={widgetId} className="relative">
                          <GestureWidget
                            config={widgetConfigs.gesture}
                            gestureLines={gestureLines}
                            onEdit={() => setEditingWidgetId("gesture")}
                            onRemove={() => handleRemoveWidget("gesture")}
                            canRemove={isRemovable}
                          />
                          <WidgetReorderButtons
                            onMoveUp={() => handleMoveWidget(widgetId, "up")}
                            onMoveDown={() =>
                              handleMoveWidget(widgetId, "down")
                            }
                            canMoveUp={canMoveUp}
                            canMoveDown={canMoveDown}
                          />
                        </div>
                      );
                    }
                    if (widgetId === "add-widgets") {
                      return (
                        <div key={widgetId} className="relative">
                          <AddWidgetsPlaceholder
                            currentOrder={widgetOrder}
                            onRestore={(id) =>
                              setWidgetOrder((prev) => {
                                const i = prev.indexOf("add-widgets");
                                if (i < 0) return [...prev, id];
                                const next = [...prev];
                                next.splice(i, 0, id);
                                return next;
                              })
                            }
                          />
                          <WidgetReorderButtons
                            onMoveUp={() => handleMoveWidget(widgetId, "up")}
                            onMoveDown={() =>
                              handleMoveWidget(widgetId, "down")
                            }
                            canMoveUp={canMoveUp}
                            canMoveDown={canMoveDown}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {editingWidgetId && widgetConfigs && (
                <WidgetEditModal
                  widgetId={editingWidgetId}
                  configs={widgetConfigs}
                  onSave={handleWidgetConfigChange}
                  onClose={() => setEditingWidgetId(null)}
                />
              )}
            </section>

            {/* Current page surface (lightweight editor placeholder) */}
            <section className="pb-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/40 text-2xl shadow-inner ring-1 ring-white/10">
                    {selectedPage?.emoji}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                      Current page
                    </p>
                    <h2 className="text-base font-semibold tracking-tight text-slate-50 md:text-lg">
                      {selectedPage?.title}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-medium text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {journalId ? "Saved to cloud" : "Draft in this tab only"}
                  </div>
                  <button
                    onClick={handleDeleteCurrentPage}
                    disabled={!selectedPage || pages.length <= 1}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-transparent px-3 py-1.5 font-medium text-rose-300/90 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-600"
                  >
                    <span className="text-xs">Delete page</span>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(91,108,255,0.14),transparent_55%),_radial-gradient(circle_at_bottom,_rgba(59,179,255,0.16),transparent_55%),_rgba(5,8,25,0.96)] shadow-[0_16px_60px_rgba(15,23,42,0.9)]">
                <div className="border-b border-white/10 bg-black/40 px-3.5 py-2 text-[11px] text-slate-400">
                  Select text to format with <strong className="text-slate-200">bold</strong>, <em className="text-slate-200">italic</em>, <span className="underline text-slate-200">underline</span>.
                </div>
                <div className="px-4 py-4 md:px-6 md:py-5">
                  <p className="mb-2 text-xs text-slate-400">
                    {selectedPage?.hint}
                  </p>
                  <RichTextEditor
                    key={selectedPage?.id}
                    value={selectedPage?.content ?? ""}
                    onChange={(html) =>
                      selectedPage &&
                      handleUpdateContent(selectedPage.id, html)
                    }
                    placeholder="Start writing…"
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function WidgetReorderButtons({
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="absolute bottom-2 right-2 z-10 flex gap-0.5 opacity-70 hover:opacity-100">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp();
        }}
        disabled={!canMoveUp}
        className="rounded p-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-30"
        aria-label="Move widget up"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown();
        }}
        disabled={!canMoveDown}
        className="rounded p-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-30"
        aria-label="Move widget down"
      >
        ▼
      </button>
    </div>
  );
}
