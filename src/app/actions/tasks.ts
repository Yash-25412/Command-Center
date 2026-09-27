"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseQuickAdd, todayISO } from "@/lib/format";

export async function quickAddTask(formData: FormData) {
  const raw = String(formData.get("text") || "").trim();
  if (!raw) return;

  const supabase = createClient();
  const { data: people } = await supabase.from("person").select("id,name").eq("active", true);
  const parsed = parseQuickAdd(raw, (people || []).map((p) => p.name));

  const doer = (people || []).find(
    (p) => p.name.toLowerCase() === (parsed.doerName || "").toLowerCase()
  );
  const me = (people || []).find((p) => p.name === "Me");

  let categoryId: string | null = null;
  if (parsed.categoryName) {
    const { data: cat } = await supabase
      .from("category")
      .select("id")
      .ilike("name", `${parsed.categoryName}%`)
      .limit(1)
      .maybeSingle();
    categoryId = cat?.id || null;
  }

  const title = parsed.title || raw;

  const { data: task, error } = await supabase
    .from("task")
    .insert({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      doer_id: doer?.id || me?.id || null,
      category_id: categoryId,
      priority: parsed.priority,
      due_date: parsed.dueDate,
      status: "planned"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("entry").insert({
    task_id: task.id,
    kind: "system",
    body: "Task created with Quick add."
  });

  revalidatePath("/work");
  redirect(`/task/${task.id}`);
}

export async function addCapture(formData: FormData) {
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const supabase = createClient();
  await supabase.from("capture").insert({ text });

  revalidatePath("/inbox");
}

export async function convertCapture(formData: FormData) {
  const captureId = String(formData.get("captureId"));
  const text = String(formData.get("text") || "");
  const supabase = createClient();

  const { data: people } = await supabase.from("person").select("id,name").eq("active", true);
  const parsed = parseQuickAdd(text, (people || []).map((p) => p.name));
  const doer = (people || []).find(
    (p) => p.name.toLowerCase() === (parsed.doerName || "").toLowerCase()
  );
  const me = (people || []).find((p) => p.name === "Me");
  const title = parsed.title || text;

  const { data: task, error } = await supabase
    .from("task")
    .insert({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      doer_id: doer?.id || me?.id || null,
      priority: parsed.priority,
      due_date: parsed.dueDate,
      status: "planned"
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("entry").insert({
    task_id: task.id,
    kind: "system",
    body: "Task created from an inbox capture."
  });
  await supabase.from("capture").delete().eq("id", captureId);

  revalidatePath("/inbox");
}

export async function dismissCapture(formData: FormData) {
  const captureId = String(formData.get("captureId"));
  const supabase = createClient();
  await supabase.from("capture").delete().eq("id", captureId);
  revalidatePath("/inbox");
}

export async function addEntry(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const kind = String(formData.get("kind") || "update") as
    | "update"
    | "meeting"
    | "decision";
  const body = String(formData.get("body") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  if (!body) return;

  const supabase = createClient();
  await supabase.from("entry").insert({
    task_id: taskId,
    kind,
    body,
    reason: reason || null
  });
  await supabase.from("task").update({ last_activity_at: new Date().toISOString() }).eq("id", taskId);

  revalidatePath(`/task/${taskId}`);
}

export async function changeStatus(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const from = String(formData.get("from"));
  const to = String(formData.get("to"));
  if (from === to) return;

  const supabase = createClient();
  const patch: Record<string, unknown> = { status: to, last_activity_at: new Date().toISOString() };
  if (to === "done") patch.completed_at = new Date().toISOString();
  if (to !== "waiting") {
    patch.waiting_on = null;
    patch.waiting_since = null;
    patch.expected_by = null;
    patch.follow_up_on = null;
  }
  if (to === "waiting") {
    const { data: current } = await supabase.from("task").select("waiting_on").eq("id", taskId).single();
    if (!current?.waiting_on) {
      patch.waiting_on = "someone";
      patch.waiting_since = todayISO();
    }
  }

  await supabase.from("task").update(patch).eq("id", taskId);
  await supabase.from("entry").insert({
    task_id: taskId,
    kind: "status",
    body: "",
    status_from: from,
    status_to: to
  });

  revalidatePath(`/task/${taskId}`);
  revalidatePath("/work");
}

export async function followUp(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const who = String(formData.get("who") || "them");
  const supabase = createClient();
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const next = d.toISOString().slice(0, 10);

  await supabase.from("task").update({ follow_up_on: next, last_activity_at: new Date().toISOString() }).eq("id", taskId);
  await supabase.from("entry").insert({
    task_id: taskId,
    kind: "update",
    body: `Followed up with ${who}. Next follow-up ${next}.`
  });

  revalidatePath(`/task/${taskId}`);
  revalidatePath("/work");
}

export async function addLink(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "Link").trim();
  if (!url) return;

  const supabase = createClient();
  await supabase.from("link").insert({
    task_id: taskId,
    url,
    title: title || url,
    type: type || "Link"
  });

  revalidatePath(`/task/${taskId}`);
}

const EDITABLE_FIELDS = new Set(["doer_id", "category_id", "priority", "due_date"]);

export async function updateTaskField(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const field = String(formData.get("field") || "");
  if (!EDITABLE_FIELDS.has(field)) return;

  let value: string | null = String(formData.get("value") ?? "");
  if (value === "") value = null;

  const supabase = createClient();
  await supabase
    .from("task")
    .update({ [field]: value, last_activity_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath(`/task/${taskId}`);
  revalidatePath("/work");
}

export async function deleteTask(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const supabase = createClient();
  await supabase.from("task").delete().eq("id", taskId);
  revalidatePath("/work");
  revalidatePath("/today");
  redirect("/work");
}

export async function quickAddStructured(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const doerId = String(formData.get("doerId") || "") || null;
  const categoryId = String(formData.get("categoryId") || "") || null;
  const priority = String(formData.get("priority") || "med") as "high" | "med" | "low";
  const dueDate = String(formData.get("dueDate") || "") || null;

  const supabase = createClient();
  const { data: task, error } = await supabase
    .from("task")
    .insert({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      doer_id: doerId,
      category_id: categoryId,
      priority,
      due_date: dueDate,
      status: "planned"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("entry").insert({
    task_id: task.id,
    kind: "system",
    body: "Task created with Quick add."
  });

  revalidatePath("/work");
  redirect(`/task/${task.id}`);
}

export async function resumeFromWaiting(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const who = String(formData.get("who") || "them");
  const supabase = createClient();

  await supabase
    .from("task")
    .update({
      status: "active",
      waiting_on: null,
      waiting_since: null,
      expected_by: null,
      follow_up_on: null,
      last_activity_at: new Date().toISOString()
    })
    .eq("id", taskId);
  await supabase.from("entry").insert([
    { task_id: taskId, kind: "update", body: `Got it from ${who}. Work resumes.` },
    { task_id: taskId, kind: "status", body: "", status_from: "Waiting", status_to: "Active" }
  ]);

  revalidatePath(`/task/${taskId}`);
  revalidatePath("/work");
}
