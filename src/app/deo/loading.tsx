export default function DeoLoading() {
  return (
    <div className="dashboard-shell animate-pulse">
      <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl border border-slate-100 bg-white" />
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[220px] rounded-xl border border-slate-100 bg-white" />
        ))}
      </div>
      <div className="min-h-[240px] flex-1 rounded-xl border border-slate-100 bg-white" />
    </div>
  );
}
