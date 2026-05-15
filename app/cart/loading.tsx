export default function CartLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-black/5 mb-16" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-6 pb-8 border-b border-black/5">
              <div className="w-24 h-32 bg-black/5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-40 bg-black/5" />
                <div className="h-3 w-24 bg-black/5" />
                <div className="h-3 w-20 bg-black/5" />
                <div className="h-8 w-24 bg-black/5 mt-4" />
              </div>
              <div className="h-4 w-16 bg-black/5 shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="h-6 w-32 bg-black/5" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-black/5" />
            <div className="h-4 w-3/4 bg-black/5" />
            <div className="h-px w-full bg-black/5 my-4" />
            <div className="h-5 w-full bg-black/5" />
          </div>
          <div className="h-14 w-full bg-black/5" />
        </div>
      </div>
    </div>
  );
}
