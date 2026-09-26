"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setTaskProject(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const projectId = String(formData.get("projectId") || "");
  const supabase = createClient();

  await supabase
    .from("task")
    .update({ project_id: projectId || null, last_activity_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath(`/task/${taskId}`);
  revalidatePath("/work");
  revalidatePath("/projects");
}

export async function addMilestone(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") || "").trim();
  const date = String(formData.get("date") || "") || null;
  if (!name) return;

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("milestone")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  await supabase.from("milestone").insert({ project_id: projectId, name, date, sort_order: nextOrder });
  revalidatePath(`/project/${projectId}`);
}

export async function toggleMilestone(formData: FormData) {
  const milestoneId = String(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId"));
  const currentlyDone = String(formData.get("done")) === "true";
  const supabase = createClient();

  await supabase
    .from("milestone")
    .update({ done_at: currentlyDone ? null : new Date().toISOString() })
    .eq("id", milestoneId);

  revalidatePath(`/project/${projectId}`);
}

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const objective = String(formData.get("objective") || "").trim();

  const { data: me } = await supabase.from("person").select("id").eq("is_me", true).maybeSingle();

  const { data: project, error } = await supabase
    .from("project")
    .insert({ name, objective, owner_id: me?.id || null, status: "active", priority: "med" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  redirect(`/project/${project.id}`);
}
