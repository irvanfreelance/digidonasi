

export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/60 to-slate-50 relative pb-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white px-5 pt-8 pb-4 flex items-center sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      <div className="px-5 pt-6 pb-6">
        <div className="h-6 w-48 bg-gray-200 rounded-md mb-6"></div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 h-32">
              <div className="w-24 h-full bg-gray-200 rounded-xl shrink-0"></div>
              <div className="flex-1 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
