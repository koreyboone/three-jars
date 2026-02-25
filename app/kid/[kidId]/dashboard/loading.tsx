// app/kid/[kidId]/dashboard/loading.tsx
export default function KidDashboardLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-savings/5 to-savings-accent/10">
      <header className="bg-savings text-white py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse" />
          <div>
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse mb-2" />
            <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-2xl shadow-md animate-pulse"
          />
        ))}
      </div>
    </main>
  )
}
