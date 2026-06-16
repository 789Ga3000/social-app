export function PostSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 mb-6 shadow-sm border border-sand/50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sand/80"></div>
          <div>
            <div className="h-4 w-24 bg-sand/80 rounded mb-2"></div>
            <div className="h-3 w-16 bg-sand/60 rounded"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-sand/80 rounded w-full"></div>
        <div className="h-4 bg-sand/80 rounded w-5/6"></div>
        <div className="h-4 bg-sand/80 rounded w-4/6"></div>
      </div>
      
      <div className="w-full h-[300px] sm:h-[400px] bg-sand/50 rounded-2xl mb-4"></div>
      
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sand/80"></div>
          <div className="h-4 w-8 bg-sand/60 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sand/80"></div>
          <div className="h-4 w-8 bg-sand/60 rounded"></div>
        </div>
      </div>
    </div>
  );
}
