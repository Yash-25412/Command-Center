import { createClient } from "@/lib/supabase/server";
import RunwayNav from "@/components/RunwayNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [{ data: people }, { data: categories }, { data: projects }] = await Promise.all([
    supabase.from("person").select("id,name,is_me").eq("active", true).order("is_me", { ascending: false }),
    supabase.from("category").select("id,name").order("name"),
    supabase.from("project").select("id,name").is("archived_at", null).neq("status", "cancelled").order("name")
  ]);

  return (
    <div className="min-h-screen">
      <RunwayNav people={people || []} categories={categories || []} projects={projects || []} />
      <main className="mx-auto max-w-[1440px] px-[clamp(18px,4vw,56px)] pb-24 pt-8">{children}</main>
    </div>
  );
}
