export default function CheckoutLoading() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-black/5 mb-16" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-black/5" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-black/5" />
                <div className="h-11 w-full bg-black/5" />
              </div>
            ))}
          </div>
          <div className="h-14 w-full bg-black/5" />
        </div>

        <div className="space-y-6">
          <div className="h-5 w-32 bg-black/5" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-20 bg-black/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-black/5" />
                <div className="h-3 w-20 bg-black/5" />
              </div>
              <div className="h-4 w-16 bg-black/5 shrink-0" />
            </div>
          ))}
          <div className="h-px w-full bg-black/5" />
          <div className="flex justify-between">
            <div className="h-5 w-16 bg-black/5" />
            <div className="h-5 w-24 bg-black/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
