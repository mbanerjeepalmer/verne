import * as React from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PodcastClipCardSkeleton() {
  return (
    <Card className="relative overflow-hidden w-full max-w-2xl rounded-xl shadow-sm border border-l-4 border-slate-200 border-l-slate-200 p-4 py-3.5">
      {/* Header section: Badge and Podcast Name */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Main Content: Thumbnail and Title details */}
      <div className="flex items-start gap-4 mt-3">
        <Skeleton className="w-14 h-14 rounded-lg shrink-0" />

        <div className="flex flex-col pt-1 gap-2.5 w-full max-w-[80%]">
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-5">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between items-center mt-2.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4">
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  )
}
