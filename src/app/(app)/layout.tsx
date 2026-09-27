import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [{ data: captures }, { data: people }, { data: categories }] = await Promise.all([
    supabase.from("capture").select("id"),
    supabase.from("person").select("id,name,is_me").eq("active", true).order("is_me", { ascending: false }),
    supabase.from("category").select("id,name").order("name")
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar inboxCount={captures?.length || 0} people={people || []} categories={categories || []} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto max-w-[1100px] px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
