"use client";

interface NoLocationScreenSkeletonProps {
  title: string;
  description: string;
}

export default function NoLocationScreenSkeleton({
  title,
  description,
}: NoLocationScreenSkeletonProps) {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50 space-y-6 overflow-auto">
        <div>
          <div className="h-7 w-72 max-w-full rounded-md bg-gray-200 animate-pulse" />
          <div className="mt-2 h-4 w-md max-w-full rounded bg-gray-100 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse"
            />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-11 rounded-lg bg-gray-100 animate-pulse" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {title} - {description}
        </p>
      </main>
    </div>
  );
}
