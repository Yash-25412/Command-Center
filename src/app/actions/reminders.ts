"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDaysISO, istToday } from "@/lib/format";

function resolveWhen(raw: string): string {
  const today = istToday();
  if (!raw || raw === "today") return today;
  if (raw === "tomorrow") return addDaysISO(today, 1);
  if (raw === "nextweek") {
    // Next Monday, IST.
    const dow = new Date(today + "T00:00:00Z").getUTCDay(); // 0 = Sun
    const toMon = ((8 - dow) % 7) || 7;
    return addDaysISO(today, toMon);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
}

function revalidateAll() {
  revalidatePath("/today");
  revalidatePath("/dashboard");
}

// link is "p:<projectId>", "u:<personId>" or "" (ad hoc).
export async function addReminder(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const when = resolveWhen(String(formData.get("when") || "today"));
  const link = String(formData.get("link") || "");
  const supabase = createClient();
  await supabase.from("reminder").insert({
    title,
    remind_on: when,
    project_id: link.startsWith("p:") ? link.slice(2) : null,
    person_id: link.startsWith("u:") ? link.slice(2) : null
  });
  revalidateAll();
}

export async function setReminderDone(id: string, done: boolean) {
  const supabase = createClient();
  await supabase.from("reminder").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  revalidateAll();
}

export async function snoozeReminder(id: string) {
  const supabase = createClient();
  await supabase.from("reminder").update({ remind_on: addDaysISO(istToday(), 1) }).eq("id", id);
  revalidateAll();
}

export async function deleteReminder(id: string) {
  const supabase = createClient();
  await supabase.from("reminder").delete().eq("id", id);
  revalidateAll();
}
