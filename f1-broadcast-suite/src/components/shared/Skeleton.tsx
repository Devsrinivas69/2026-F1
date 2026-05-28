/**
 * Skeleton loading components — styled to match the F1 Commander dark theme.
 * The base shimmer uses a CSS animation defined in styles.css (or inline keyframes here).
 */

// ─── Base Skeleton Block ────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-sm ${className}`}
      style={{ width, height }}
    />
  );
}

// ─── Live Page Skeleton ──────────────────────────────────────────────────────

export function LivePageSkeleton() {
  return (
    <div className="bg-[#050505] min-h-[calc(100vh-56px)]">
      {/* Top broadcast bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-4 lg:px-10 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton width="6px" height="6px" className="rounded-full" />
          <Skeleton width="280px" height="10px" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton width="160px" height="10px" />
        </div>
      </div>

      <div className="py-5 px-4 lg:px-8 max-w-[1760px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* Timing tower skeleton — 20 rows */}
          <div className="w-full xl:w-96 shrink-0 space-y-1.5">
            {/* header */}
            <div className="flex items-center justify-between mb-3">
              <Skeleton width="120px" height="10px" />
              <Skeleton width="60px" height="10px" />
            </div>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 bg-[#0d0d0d] rounded-sm"
                style={{ opacity: 1 - i * 0.03 }}
              >
                <Skeleton width="22px" height="10px" />
                <Skeleton width="8px" height="28px" className="rounded" />
                <Skeleton width="36px" height="10px" />
                <Skeleton width="80px" height="10px" className="ml-auto" />
                <Skeleton width="60px" height="10px" />
              </div>
            ))}
          </div>

          {/* Right panel skeletons */}
          <div className="flex-1 flex flex-col gap-5 w-full min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Track map skeleton */}
              <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <Skeleton width="10px" height="10px" className="rounded-full" />
                  <Skeleton width="100px" height="10px" />
                </div>
                <Skeleton className="w-full" height="260px" />
              </div>

              {/* Race control skeleton */}
              <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <Skeleton width="120px" height="10px" />
                </div>
                <div className="p-3 space-y-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton width="50px" height="10px" />
                      <Skeleton height="10px" className="flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team radio skeleton */}
            <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md p-4 space-y-3">
              <Skeleton width="140px" height="10px" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[#111] rounded-sm p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton width="8px" height="24px" className="rounded" />
                      <Skeleton width="60px" height="10px" />
                      <Skeleton width="80px" height="10px" className="ml-auto" />
                    </div>
                    <Skeleton height="8px" className="w-full" />
                    <Skeleton height="8px" width="75%" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Telemetry Page Skeleton ─────────────────────────────────────────────────

export function TelemetrySkeleton() {
  return (
    <div className="bg-[#050505] min-h-[calc(100vh-56px)]">
      {/* Header bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-6 lg:px-12 py-3 flex items-center gap-4">
        <Skeleton width="16px" height="16px" className="rounded-full" />
        <Skeleton width="100px" height="10px" />
        <div className="w-px h-4 bg-white/10" />
        <Skeleton width="180px" height="10px" />
      </div>

      <div className="px-4 lg:px-12 py-8 max-w-[1600px] mx-auto space-y-6">
        {/* Driver pickers */}
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton width="80px" height="9px" />
              <Skeleton height="44px" className="w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Driver panel A */}
        <DriverPanelSkeleton />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <Skeleton width="200px" height="9px" />
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Driver panel B */}
        <DriverPanelSkeleton />
      </div>
    </div>
  );
}

function DriverPanelSkeleton() {
  return (
    <div className="space-y-5">
      {/* Driver header card */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0d0d0d] ring-1 ring-white/5">
        <Skeleton width="4px" height="48px" className="rounded-full" />
        <Skeleton width="40px" height="40px" className="rounded-md" />
        <Skeleton width="40px" height="40px" className="rounded-md" />
        <div className="space-y-2">
          <Skeleton width="160px" height="12px" />
          <Skeleton width="100px" height="10px" />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md overflow-hidden">
        <div className="p-3 flex gap-2 border-b border-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="70px" height="26px" className="rounded-sm" />
          ))}
        </div>
        <Skeleton className="w-full" height="200px" />
      </div>

      {/* Advanced analytics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="110px" height="9px" />
            <Skeleton className="w-full rounded-md" height="180px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pit Wall Skeleton ────────────────────────────────────────────────────────

export function PitWallSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-white/5 h-10">
        <Skeleton width="60px" height="9px" />
        <Skeleton width="200px" height="9px" />
        <Skeleton width="60px" height="10px" />
      </div>

      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-1.5 p-1.5">
        {/* Timing tower col */}
        <div className="col-span-3 row-span-6 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3 space-y-1.5">
          <Skeleton width="80px" height="9px" className="mb-3" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Skeleton width="20px" height="9px" />
              <Skeleton width="6px" height="22px" />
              <Skeleton width="36px" height="9px" />
              <Skeleton className="flex-1" height="9px" />
            </div>
          ))}
        </div>

        {/* Track map */}
        <div className="col-span-6 row-span-4 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        {/* Weather */}
        <div className="col-span-3 row-span-2 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3 space-y-2">
          <Skeleton width="70px" height="9px" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton width="50px" height="9px" />
              <Skeleton width="40px" height="9px" />
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="col-span-3 row-span-2 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3 space-y-2">
          <Skeleton width="60px" height="9px" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton width="60px" height="9px" />
              <Skeleton width="50px" height="9px" />
            </div>
          ))}
        </div>

        {/* Race control */}
        <div className="col-span-9 row-span-2 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3 space-y-2">
          <Skeleton width="120px" height="9px" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton width="50px" height="9px" />
              <Skeleton className="flex-1" height="9px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Netflix / Story Skeleton ────────────────────────────────────────────────

export function NetflixSkeleton() {
  return (
    <div className="relative bg-[#050505] min-h-screen flex flex-col justify-center px-8 md:px-16 max-w-[1400px] mx-auto">
      <Skeleton width="180px" height="9px" className="mb-6" />
      <div className="space-y-4 mb-8">
        <Skeleton height="clamp(3rem,12vw,10rem)" className="w-4/5 rounded" />
        <Skeleton height="clamp(2rem,8vw,6rem)" className="w-3/5 rounded" />
      </div>
      <Skeleton width="240px" height="12px" className="mb-12" />
      <div className="flex items-center gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="60px" height="9px" />
            <Skeleton width="80px" height="24px" />
          </div>
        ))}
      </div>
    </div>
  );
}
