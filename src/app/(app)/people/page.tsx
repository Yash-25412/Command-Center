import { redirect } from "next/navigation";

// Folded into the Runway layout; old links keep working.
export default function Page() {
  redirect("/dashboard?tab=team");
}
