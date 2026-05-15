export default function ProfileLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-black/5 mb-16" />

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-black/5" />
              <div className="h-11 w-full bg-black/5" />
            </div>
          ))}
        </div>
        <div className="h-12 w-40 bg-black/5" />
      </div>
    </div>
  );
}
