export default function FavoritesLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-black/5 mb-16" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="aspect-3/4 bg-black/5 mb-6" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-black/5" />
              <div className="h-3 w-20 bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
