export default function ShopLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-16">
        <div className="h-14 w-72 bg-black/5 mb-6" />
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 w-16 bg-black/5" />
            ))}
          </div>
          <div className="h-9 w-36 bg-black/5" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="aspect-3/4 bg-black/5 mb-6" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-black/5" />
                <div className="h-3 w-20 bg-black/5" />
              </div>
              <div className="h-4 w-16 bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
