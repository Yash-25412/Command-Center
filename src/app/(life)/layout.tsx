import LifeSidebar from "@/components/LifeSidebar";
import LifeThemeScope from "@/components/LifeThemeScope";

export default function LifeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <LifeThemeScope />
      <LifeSidebar />
      <div className="flex-1 min-w-0">
        <main className="mx-auto max-w-[1100px] px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
