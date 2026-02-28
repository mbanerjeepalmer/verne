"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AudioLines, ExternalLink, Play, Pause, CornerDownLeft } from "lucide-react"

interface PodcastClipCardProps {
  podcastName: string
  title: string
  clipStartTime: string
  clipLength: string
  fullEpisodeLength: string
  imageUrl: string
}

function parseTimeToSeconds(timeStr: string) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function formatSecondsToTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PodcastClipCard({
  podcastName,
  title,
  clipStartTime,
  clipLength,
  fullEpisodeLength,
  imageUrl,
}: PodcastClipCardProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentProgress, setCurrentProgress] = React.useState<number | null>(null)
  const [hoverProgress, setHoverProgress] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const progressRef = React.useRef<HTMLDivElement>(null)

  const startSec = parseTimeToSeconds(clipStartTime)
  const lenSec = parseTimeToSeconds(clipLength)
  const fullSec = parseTimeToSeconds(fullEpisodeLength) || 1 // prevent div by zero

  const leftOffset = Math.min(100, Math.max(0, (startSec / fullSec) * 100))
  // Cap width so it doesn't overflow 100%
  const clipWidthPercent = Math.min(100 - leftOffset, (lenSec / fullSec) * 100)

  const getProgressFromEvent = (clientX: number) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      return Math.max(0, Math.min(100, (x / rect.width) * 100))
    }
    return leftOffset
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const newProg = getProgressFromEvent(e.clientX)
    setIsDragging(true)
    setCurrentProgress(newProg)
    setHoverProgress(newProg)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const newProg = getProgressFromEvent(e.clientX)
    setHoverProgress(newProg)
    
    if (isDragging) {
      setCurrentProgress(newProg)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newProg = getProgressFromEvent(e.clientX)
      setCurrentProgress(newProg)
      setIsDragging(false)
      setIsPlaying(true)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverProgress(null)
    }
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  // Determine what to show on the progress bar. We show the static clip representation
  // overlaid with a dynamic playback progress if the user has interacted.
  const displayProgress = currentProgress !== null ? currentProgress : leftOffset

  const activeProgressDisplay = (hoverProgress !== null || isDragging) && hoverProgress !== null ? hoverProgress : displayProgress
  const currentSeconds = (activeProgressDisplay / 100) * fullSec
  const dynamicTimeString = formatSecondsToTime(currentSeconds)

  const isOutsideClip = 
    currentProgress !== null && 
    (currentProgress < leftOffset || currentProgress > leftOffset + clipWidthPercent)
    
  const jumpBackToClip = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentProgress(leftOffset) // leftOffset represents the exact start of the clip!
    setIsPlaying(true)
  }

  return (
    <Card className="group relative overflow-hidden w-full max-w-2xl rounded-xl shadow-sm border border-l-4 border-slate-200 border-l-[#3b82f6] dark:border-slate-800 dark:border-l-[#3b82f6] bg-white dark:bg-slate-950 p-4 py-3.5 hover:shadow-md hover:border-[#3b82f6] dark:hover:border-[#3b82f6] transition-all cursor-pointer duration-200 ease-in-out">
      {/* Header section: Badge and Podcast Name */}
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="bg-blue-100/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-none"
        >
          <AudioLines className="w-3.5 h-3.5" />
          CLIP
        </Badge>
        <span className="text-sm text-muted-foreground dark:text-slate-400 font-medium flex-1">
          {clipLength} from <span className="text-slate-700 dark:text-slate-300">{podcastName}</span>
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 ml-auto"
          onClick={jumpBackToClip}
        >
          <CornerDownLeft className="w-3 h-3 mr-1" />
          Back to clip
        </Button>
      </div>

      {/* Main Content: Thumbnail and Title details */}
      <div className="flex items-start gap-4 mt-3">
        <button 
          className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
        >
          <img
            src={imageUrl}
            alt={title}
            className={`object-cover w-full h-full opacity-90 transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
          />
          {/* Play Button Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-black/40' : 'bg-black/20 group-hover:bg-black/40'}`}>
            <div className={`backdrop-blur-sm rounded-full p-1.5 transition-all duration-300 shadow-sm ${isPlaying ? 'bg-white/20 scale-110' : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-110'}`}>
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-col pt-1 min-w-0">
          <h3 className="font-semibold text-[17px] leading-tight text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1 truncate">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5">
            @ {clipStartTime} <span className="mx-1">&middot;</span> {clipLength}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div 
        role="slider"
        aria-label="Seek podcast clip progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={currentProgress !== null ? currentProgress : leftOffset}
        tabIndex={0}
        className="mt-3.5 cursor-pointer py-2 -my-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] rounded-sm"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            const next = Math.min(100, (currentProgress !== null ? currentProgress : leftOffset) + 5)
            setCurrentProgress(next)
          }
          if (e.key === 'ArrowLeft') {
            const prev = Math.max(0, (currentProgress !== null ? currentProgress : leftOffset) - 5)
            setCurrentProgress(prev)
          }
        }}
        ref={progressRef}
      >
        {/* Custom Progress Bar for Clip Representation */}
        <div className="relative w-full h-2 rounded-full mb-2 bg-[#f1f5f9] dark:bg-slate-800 overflow-hidden group-hover:h-2.5 transition-all shadow-inner">
          {/* The Clip Bound Indicator (Darker Color as Requested) */}
          <div 
            className="absolute top-0 bottom-0 bg-blue-200 dark:bg-blue-900/60 rounded-full transition-all duration-500 group-hover:bg-blue-300 dark:group-hover:bg-blue-800/80"
            style={{ 
              left: `${leftOffset}%`, 
              width: `${clipWidthPercent}%` 
            }}
          />
          {/* Current Playback Progress Indicator (Lighter Color to stand out on the clip) */}
          {currentProgress !== null && (
             <div 
               className="absolute top-0 bottom-0 bg-blue-600 dark:bg-blue-500 rounded-full pointer-events-none shadow-sm"
               style={{ width: `${currentProgress}%`, transition: isDragging ? 'none' : 'width 0.3s ease-out' }}
             />
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-slate-400 mt-1.5 font-medium">
          <span className={`font-mono tracking-tight transition-colors ${(hoverProgress !== null || currentProgress !== null) ? 'text-blue-600 dark:text-blue-400' : ''} ${hoverProgress !== null && !isDragging ? 'text-blue-400 dark:text-blue-300' : ''}`}>
            {dynamicTimeString}
          </span>
          <span>Full episode</span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-2.5">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Listen to full episode
        </a>
      </div>
    </Card>
  )
}
