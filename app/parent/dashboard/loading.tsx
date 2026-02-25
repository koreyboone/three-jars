// app/parent/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-14 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
