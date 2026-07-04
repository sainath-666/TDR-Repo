export default function ReviewLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-5 sm:px-6">
      <div className="mb-5 h-14 rounded-xl border border-slate-100 bg-white" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="h-48 rounded-xl border border-slate-100 bg-white" />
          <div className="h-48 rounded-xl border border-slate-100 bg-white" />
          <div className="h-32 rounded-xl border border-slate-100 bg-white" />
        </div>
        <div className="h-56 rounded-xl border border-slate-100 bg-white" />
      </div>
    </div>
  );
}
