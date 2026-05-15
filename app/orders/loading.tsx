export default function OrdersLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-black/5 mb-16" />

      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-black/5 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-black/5" />
                <div className="h-3 w-24 bg-black/5" />
              </div>
              <div className="h-6 w-20 bg-black/5" />
            </div>
            <div className="flex gap-4 pt-2">
              <div className="w-16 h-20 bg-black/5 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-black/5" />
                <div className="h-3 w-28 bg-black/5" />
                <div className="h-3 w-20 bg-black/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
