import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: captures } = await supabase.from("capture").select("id");
  const { data: people } = await supabase.from("person").select("name").order("is_me", { ascending: false });

  return (
    <div className="flex min-h-screen">
      <Sidebar inboxCount={captures?.length || 0} peopleNames={(people || []).map((p) => p.name)} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto max-w-[1100px] px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
