export function PageSkeleton({ title = "Loading" }: { title?: string }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8 lg:pl-72">
      <div
        className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-slate-800"
        aria-label={title}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card h-32 animate-pulse bg-slate-900" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card h-72 animate-pulse bg-slate-900" />
        ))}
      </div>
    </div>
  );
}
