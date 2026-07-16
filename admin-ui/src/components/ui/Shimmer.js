/** Shared shimmer loading primitives for admin pages. */

export const ShimmerBox = ({ className = "", rounded = "rounded-lg", style }) => (
  <div
    className={`hyoka-shimmer ${rounded} ${className}`.trim()}
    style={style}
    aria-hidden="true"
  />
);

export const ShimmerTableSkeleton = ({ rows = 8, className = "" }) => (
  <div className={`space-y-1 px-4 py-2 ${className}`} aria-busy="true" aria-label="Loading">
    <div className="flex gap-2 border-b border-gray-100 pb-3 mb-2">
      {[...Array(6)].map((_, i) => (
        <ShimmerBox key={i} className="h-7 flex-1" rounded="rounded-md" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
        <ShimmerBox className="w-[18px] h-[18px] shrink-0" rounded="rounded" />
        <ShimmerBox className="h-4 w-[11%] shrink-0" />
        <ShimmerBox className="h-4 flex-1 min-w-0" />
        <ShimmerBox className="h-4 w-[7%] shrink-0" />
        <ShimmerBox className="h-4 w-[9%] shrink-0" />
        <ShimmerBox className="h-4 w-[14%] shrink-0 hidden md:block" />
        <ShimmerBox className="h-8 w-[72px] shrink-0" rounded="rounded-full" />
      </div>
    ))}
  </div>
);

export const ShimmerCardListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-6">
          <ShimmerBox className="w-14 h-14 shrink-0" rounded="rounded-full" />
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <ShimmerBox className="h-5 w-32" />
                <ShimmerBox className="h-4 w-48 max-w-full" />
              </div>
              <ShimmerBox className="h-8 w-24 shrink-0" rounded="rounded-full" />
            </div>
            <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <ShimmerBox key={s} className="w-4 h-4" rounded="rounded-full" />
                ))}
              </div>
              <ShimmerBox className="h-4 w-full" />
              <ShimmerBox className="h-4 w-3/4" />
            </div>
            <div className="flex gap-4 pt-2">
              <ShimmerBox className="h-10 flex-1" rounded="rounded-xl" />
              <ShimmerBox className="h-10 w-28" rounded="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ShimmerPageSkeleton = () => (
  <div className="flex flex-1 min-h-0 flex-col bg-[#F5F5F5] px-8 py-6 overflow-hidden" aria-busy="true">
    <ShimmerBox className="h-8 w-56 mb-2" />
    <ShimmerBox className="h-4 w-80 max-w-full mb-6" />
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <ShimmerTableSkeleton rows={7} />
    </div>
  </div>
);

export const ShimmerWidgetsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 py-2" aria-busy="true">
    {[...Array(5)].map((_, i) => (
      <ShimmerBox key={i} className="h-28" rounded="rounded-xl" />
    ))}
  </div>
);

export const ShimmerSettingsSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-8 px-8 py-6" aria-busy="true">
    <div className="space-y-2">
      <ShimmerBox className="h-8 w-48" />
      <ShimmerBox className="h-4 w-96 max-w-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <ShimmerBox className="h-5 w-40" />
          <ShimmerBox className="h-10 w-full" rounded="rounded-lg" />
          <ShimmerBox className="h-10 w-full" rounded="rounded-lg" />
          <ShimmerBox className="h-24 w-full" rounded="rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const ShimmerChartSkeleton = ({ height = 260 }) => (
  <ShimmerBox className="w-full" style={{ height }} rounded="rounded-xl" />
);

export const ShimmerBarListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-5" aria-hidden="true">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <ShimmerBox className="h-4 w-8 shrink-0" />
        <ShimmerBox className="h-2.5 flex-1" rounded="rounded-full" />
        <ShimmerBox className="h-4 w-14 shrink-0" />
      </div>
    ))}
  </div>
);

export const ShimmerActivitySkeleton = ({ rows = 5 }) => (
  <div className="space-y-4" aria-hidden="true">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-start gap-3">
        <ShimmerBox className="w-2 h-2 mt-2 shrink-0" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBox className="h-4 w-full max-w-md" />
          <ShimmerBox className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export const ShimmerProductTableSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3" aria-hidden="true">
    <div className="grid grid-cols-5 gap-3 pb-2 border-b border-gray-100">
      {[...Array(5)].map((_, i) => (
        <ShimmerBox key={i} className="h-3 w-full" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="grid grid-cols-5 gap-3 items-center py-2">
        <ShimmerBox className="h-4 w-full" />
        <ShimmerBox className="h-4 w-10 mx-auto" />
        <ShimmerBox className="h-4 w-12 mx-auto" />
        <ShimmerBox className="h-4 w-full" />
        <ShimmerBox className="h-4 w-14 ml-auto" />
      </div>
    ))}
  </div>
);

export const ShimmerStatCardsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className={`rounded-2xl border p-5 ${
          i === 0 ? "border-orange-200 bg-orange-50/80" : "border-gray-100 bg-white"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShimmerBox className="w-7 h-7" rounded="rounded-lg" />
          <ShimmerBox className="h-4 w-24" />
        </div>
        <ShimmerBox className="h-8 w-20" />
      </div>
    ))}
  </div>
);

export const ShimmerDashboardSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ShimmerBox className="h-[220px] w-full" rounded="rounded-3xl" />
      <ShimmerStatCardsSkeleton />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
        <div className="space-y-2">
          <ShimmerBox className="h-5 w-40" />
          <ShimmerBox className="h-4 w-64 max-w-full" />
        </div>
        <ShimmerChartSkeleton height={260} />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <ShimmerBox className="h-5 w-40" />
            <ShimmerBox className="h-4 w-32" />
          </div>
          <ShimmerBox className="h-8 w-16 shrink-0" />
        </div>
        <ShimmerBarListSkeleton rows={5} />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <ShimmerBox className="h-5 w-36" />
          <ShimmerBox className="h-4 w-28" />
        </div>
        <ShimmerActivitySkeleton rows={5} />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
        <div className="space-y-2">
          <ShimmerBox className="h-5 w-48" />
          <ShimmerBox className="h-4 w-40" />
        </div>
        <ShimmerProductTableSkeleton rows={4} />
      </div>
    </div>
  </div>
);
