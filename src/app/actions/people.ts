"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const HUES = [200, 260, 20, 140, 320, 80, 0, 180, 40, 300];

function refresh() {
  revalidatePath("/people");
  revalidatePath("/work");
  revalidatePath("/today");
  revalidatePath("/waiting");
}

export async function addPerson(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const role = String(formData.get("role") || "").trim();

  const supabase = createClient();
  const { count } = await supabase.from("person").select("id", { count: "exact", head: true });
  const hue = HUES[(count || 0) % HUES.length];

  await supabase.from("person").insert({ name, role: role || null, hue });
  refresh();
}

export async function renamePerson(formData: FormData) {
  const personId = String(formData.get("personId"));
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  if (!name) return;

  const supabase = createClient();
  await supabase.from("person").update({ name, role: role || null }).eq("id", personId);
  refresh();
}

export async function setPersonActive(formData: FormData) {
  const personId = String(formData.get("personId"));
  const active = String(formData.get("active")) === "true";

  const supabase = createClient();
  await supabase.from("person").update({ active }).eq("id", personId);
  refresh();
}
