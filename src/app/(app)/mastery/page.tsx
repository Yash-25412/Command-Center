import MasteryOS from "@/components/life/mastery/MasteryOS";
import { loadMasteryState } from "@/app/actions/mastery";

export const metadata = {
  title: "Life // Mastery OS"
};

export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const initialStore = await loadMasteryState();
  return <MasteryOS initialStore={initialStore} />;
}
