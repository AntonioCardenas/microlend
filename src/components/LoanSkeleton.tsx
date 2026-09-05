import React from 'react';

interface LoanSkeletonCardProps {
  count?: number;
}

export function LoanSkeletonCard() {
  return (
    <article className="rounded-2xl bg-[#0e1526] border border-slate-800/80 overflow-hidden shadow-lg animate-pulse flex flex-col">
      {/* Skeleton Image */}
      <div className="relative h-52 w-full bg-slate-900/90 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/60" />
        <div className="absolute top-3 left-3 h-5 w-20 bg-slate-800/80 rounded" />
        <div className="absolute top-3 right-3 h-5 w-24 bg-slate-800/80 rounded" />
      </div>

      {/* Skeleton Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/70 rounded w-1/4" />
          <div className="h-4 bg-slate-800/80 rounded w-3/4 mt-2" />
          <div className="h-3 bg-slate-800/60 rounded w-full" />
          <div className="h-3 bg-slate-800/60 rounded w-5/6" />
        </div>

        {/* Skeleton Impact Metrics */}
        <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-800/60 bg-[#090e1a]/40 rounded-lg px-3">
          <div className="space-y-1">
            <div className="h-2.5 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        </div>

        {/* Skeleton Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3.5 bg-slate-800 rounded w-28" />
            <div className="h-3.5 bg-slate-800 rounded w-16" />
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800/80" />
          <div className="flex justify-between">
            <div className="h-2.5 bg-slate-800/60 rounded w-20" />
            <div className="h-2.5 bg-slate-800/60 rounded w-24" />
          </div>
        </div>

        {/* Skeleton Footer */}
        <div className="pt-2 flex items-center justify-between">
          <div className="h-3.5 bg-slate-800 rounded w-20" />
          <div className="flex space-x-2">
            <div className="h-9 w-14 bg-slate-800/70 rounded-xl" />
            <div className="h-9 w-24 bg-indigo-950/60 rounded-xl" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function LoanSkeletonGrid({ count = 6 }: LoanSkeletonCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading micro-loans">
      {Array.from({ length: count }).map((_, i) => (
        <LoanSkeletonCard key={`loan-skeleton-${i}`} />
      ))}
    </div>
  );
}

export default LoanSkeletonGrid;
