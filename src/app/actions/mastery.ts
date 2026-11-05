"use server";

import { createClient } from "@/lib/supabase/server";

const ROW_ID = "singleton";

// Loads the whole Mastery OS store from Supabase. Returns null if the row
// doesn't exist yet or holds nothing useful -- the client falls back to its
// own defaults in that case.
export async function loadMasteryState(): Promise<any | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("mastery_state").select("data").eq("id", ROW_ID).maybeSingle();
  if (error || !data) return null;
  return data.data && Object.keys(data.data).length > 0 ? data.data : null;
}

// Upserts the whole store. Called (debounced) from the client on every
// change -- phase checks, tissue status, field notes, session logs, the
// recovery buff, the calendar log, and which skill/phase/tab is active.
//
// Deliberately does NOT call revalidatePath here. Calling a server action
// from a client component makes Next.js auto-refresh the current route's
// server components once the action resolves -- with revalidatePath that
// meant every debounced save (every phase click, every skill switch) forced
// /mastery's server component to refetch and re-hand-down `initialStore`,
// which raced with whatever the user had just clicked locally and snapped
// the UI back to the previous phase/skill for a moment. Nothing else reads
// this table server-side, so there's nothing to revalidate.
export async function saveMasteryState(state: any): Promise<void> {
  const supabase = createClient();
  await supabase.from("mastery_state").upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
}
