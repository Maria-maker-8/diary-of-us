"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

type AuthState = {
  user: { id: string; email?: string } | null;
  journalId: string | null;
  inviteCode: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  joinWithCode: (code: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    journalId: null,
    inviteCode: null,
    loading: true,
  });

  const ensureJournal = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data: members } = await supabase
      .from("journal_members")
      .select("journal_id")
      .eq("user_id", userId)
      .limit(1);
    if (members && members.length > 0) {
      const journalId = members[0].journal_id;
      const { data: journal } = await supabase
        .from("journals")
        .select("invite_code")
        .eq("id", journalId)
        .single();
      const code = journal?.invite_code ?? null;
      setState((s) => ({
        ...s,
        journalId,
        inviteCode: code,
      }));
      return;
    }
    const code = makeInviteCode();
    const { data: newJournal, error: je } = await supabase
      .from("journals")
      .insert({ invite_code: code })
      .select("id")
      .single();
    if (je || !newJournal) return;
    await supabase.from("journal_members").insert({
      journal_id: newJournal.id,
      user_id: userId,
    });
    setState((s) => ({
      ...s,
      journalId: newJournal.id,
      inviteCode: code,
    }));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((s) => ({
          ...s,
          user: { id: session.user.id, email: session.user.email ?? undefined },
          loading: false,
        }));
        ensureJournal(session.user.id);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((s) => ({
          ...s,
          user: { id: session.user.id, email: session.user.email ?? undefined },
        }));
        ensureJournal(session.user.id);
      } else {
        setState((s) => ({
          ...s,
          user: null,
          journalId: null,
          inviteCode: null,
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [ensureJournal]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error("Supabase not configured") };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ?? null };
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error("Supabase not configured") };
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setState((s) => ({
      ...s,
      user: null,
      journalId: null,
      inviteCode: null,
    }));
  }, []);

  const joinWithCode = useCallback(
    async (code: string) => {
      if (!supabase || !state.user) return { error: new Error("Not signed in") };
      const normalized = code.trim().toUpperCase();
      const { data: journals } = await supabase
        .from("journals")
        .select("id")
        .eq("invite_code", normalized)
        .limit(1);
      if (!journals?.length) return { error: new Error("Invalid invite code") };
      const { error } = await supabase.from("journal_members").insert({
        journal_id: journals[0].id,
        user_id: state.user.id,
      });
      if (error) return { error };
      setState((s) => ({
        ...s,
        journalId: journals[0].id,
        inviteCode: normalized,
      }));
      return { error: null };
    },
    [state.user],
  );

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    joinWithCode,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}
