// Shown while the page awaits its Supabase fetch (loadMasteryState).
export default function MasteryLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading Life Mastery">
      <div className="h-[86px] w-[420px] max-w-full animate-pulse rounded-[22px] bg-white/[0.04]" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="glass h-[84px] animate-pulse rounded-[22px]" />
        ))}
      </div>
      <div className="glass h-[420px] animate-pulse rounded-[26px]" />
    </div>
  );
}
