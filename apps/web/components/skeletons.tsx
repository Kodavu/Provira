import { Card, Skeleton } from "@/components/ui";

/** Loading placeholder that mirrors the public profile layout (header + stats + body). */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Card className="overflow-hidden p-0">
        <Skeleton className="h-24 rounded-none sm:h-28" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <Skeleton className="h-20 w-20 rounded-2xl ring-4 ring-surface sm:h-24 sm:w-24" />
            <div className="space-y-2 pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="mt-3 h-6 w-16" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Card className="space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card className="h-40 p-5">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    </div>
  );
}
