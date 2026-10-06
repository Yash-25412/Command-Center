"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function refresh() {
  revalidatePath("/life");
  revalidatePath("/life/trading");
  revalidatePath("/life/side-hustle");
  revalidatePath("/life/skills");
  revalidatePath("/life/habits");
}

// ---------- Skills (ladder) ----------

export async function setSkillStage(formData: FormData) {
  const skillId = String(formData.get("skillId"));
  const stage = Number(formData.get("stage"));
  if (!skillId || !stage) return;

  const supabase = createClient();
  await supabase.from("skill").update({ current_stage: stage }).eq("id", skillId);
  refresh();
}

export async function addSkill(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const stagesRaw = String(formData.get("stages") || "");
  if (!title) return;

  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = createClient();
  await supabase.from("skill").insert({
    title,
    kind: "skill",
    stages: stages.length ? stages : ["Getting started", "Making progress", "Comfortable", "Advanced", "Mastered"],
    current_stage: 1
  });
  refresh();
}

export async function toggleSkillPractice(formData: FormData) {
  const skillId = String(formData.get("skillId"));
  const date = String(formData.get("date"));
  if (!skillId || !date) return;

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("skill_practice_log")
    .select("id,done")
    .eq("skill_id", skillId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase.from("skill_practice_log").update({ done: !existing.done }).eq("id", existing.id);
  } else {
    await supabase.from("skill_practice_log").insert({ skill_id: skillId, date, done: true });
  }
  refresh();
}

// ---------- Side hustle pipeline ----------

export async function addIdea(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!title) return;

  const supabase = createClient();
  await supabase.from("side_hustle_idea").insert({ title, note });
  refresh();
}

const STAGE_ORDER = ["idea", "talks", "negotiating", "committed"];

export async function advanceIdea(formData: FormData) {
  const ideaId = String(formData.get("ideaId"));
  if (!ideaId) return;

  const supabase = createClient();
  const { data: idea } = await supabase.from("side_hustle_idea").select("stage").eq("id", ideaId).maybeSingle();
  if (!idea) return;

  const i = STAGE_ORDER.indexOf(idea.stage);
  const next = STAGE_ORDER[Math.min(i + 1, STAGE_ORDER.length - 1)];
  await supabase.from("side_hustle_idea").update({ stage: next }).eq("id", ideaId);
  refresh();
}

export async function parkIdea(formData: FormData) {
  const ideaId = String(formData.get("ideaId"));
  if (!ideaId) return;
  const supabase = createClient();
  await supabase.from("side_hustle_idea").update({ stage: "parked" }).eq("id", ideaId);
  refresh();
}

// ---------- Habits ----------

export async function addHabit(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const supabase = createClient();
  await supabase.from("habit").insert({ title });
  refresh();
}

export async function toggleHabitDay(formData: FormData) {
  const habitId = String(formData.get("habitId"));
  const date = String(formData.get("date"));
  if (!habitId || !date) return;

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("habit_log")
    .select("id,done")
    .eq("habit_id", habitId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase.from("habit_log").update({ done: !existing.done }).eq("id", existing.id);
  } else {
    await supabase.from("habit_log").insert({ habit_id: habitId, date, done: true });
  }
  refresh();
}

// ---------- Trading journal ----------

// Points captured and realized R are always derived from entry/sl/tp/exit —
// never typed in by hand — so a win/loss always matches what actually
// happened on the chart, for both Long and Short trades.
function calcTradeMath(side: string, entry: number | null, sl: number | null, tp: number | null, exit: number | null) {
  let points: number | null = null;
  if (entry !== null && exit !== null) {
    points = side === "Short" ? entry - exit : exit - entry;
  }

  const risk = entry !== null && sl !== null ? Math.abs(entry - sl) : null;
  const reward = entry !== null && tp !== null ? Math.abs(tp - entry) : null;

  const plannedRR = risk && reward ? reward / risk : null;
  const realizedR = risk && points !== null ? points / risk : null;

  return { points, plannedRR, realizedR };
}

export async function addTrade(formData: FormData) {
  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));
  const symbol = String(formData.get("symbol") || "").trim();
  const side = String(formData.get("side") || "Long");
  const entry = formData.get("entry") ? Number(formData.get("entry")) : null;
  const sl = formData.get("sl") ? Number(formData.get("sl")) : null;
  const tp = formData.get("tp") ? Number(formData.get("tp")) : null;
  const exit = formData.get("exit") ? Number(formData.get("exit")) : null;
  const setup = String(formData.get("setup") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim();
  if (!symbol) return;

  const { points, realizedR } = calcTradeMath(side, entry, sl, tp, exit);

  const supabase = createClient();
  const { data: trade, error } = await supabase
    .from("trade")
    .insert({
      date,
      symbol,
      side,
      entry,
      exit,
      sl,
      tp,
      pnl: points ?? 0, // "pnl" stores POINTS captured, not a rupee amount
      r_multiple: realizedR,
      setup,
      notes
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Attach any uploaded chart screenshots / broker statement crops.
  const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of images) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${trade.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("trade-images")
      .upload(path, buffer, { contentType: file.type || "image/png" });

    if (!uploadError) {
      const { data: pub } = supabase.storage.from("trade-images").getPublicUrl(path);
      await supabase.from("trade_image").insert({ trade_id: trade.id, url: pub.publicUrl, path });
    }
  }

  refresh();
  redirect("/life/trading");
}

export async function deleteTradeImage(formData: FormData) {
  const imageId = String(formData.get("imageId"));
  const path = String(formData.get("path"));
  const tradeId = String(formData.get("tradeId") || "");
  if (!imageId) return;

  const supabase = createClient();
  await supabase.storage.from("trade-images").remove([path]);
  await supabase.from("trade_image").delete().eq("id", imageId);
  refresh();
  if (tradeId) revalidatePath(`/life/trading/${tradeId}`);
}
