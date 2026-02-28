"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"

interface FullPodcastCardProps {
  podcastName: string
  title: string
  currentTimeString: string
  totalTimeString: string
  progressValue: number
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

export function FullPodcastCard({
  podcastName,
  title,
  currentTimeString: initialCurrentTimeString,
  totalTimeString,
  progressValue: initialProgressValue,
  imageUrl,
}: FullPodcastCardProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(initialProgressValue)
  const [hoverProgress, setHoverProgress] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const progressRef = React.useRef<HTMLDivElement>(null)

  const totalSeconds = parseTimeToSeconds(totalTimeString) || 1
  
  // Decide which progress to use for the timestamp display. 
  // If we are hovering OR dragging, show the temp hover progress.
  const activeProgressDisplay = (hoverProgress !== null || isDragging) && hoverProgress !== null ? hoverProgress : progress
  
  const currentSeconds = (activeProgressDisplay / 100) * totalSeconds
  const dynamicTimeString = formatSecondsToTime(currentSeconds)

  const getProgressFromEvent = (clientX: number) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      return Math.max(0, Math.min(100, (x / rect.width) * 100))
    }
    return 0
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const newProg = getProgressFromEvent(e.clientX)
    setIsDragging(true)
    setProgress(newProg)
    setHoverProgress(newProg)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const newProg = getProgressFromEvent(e.clientX)
    setHoverProgress(newProg)
    
    if (isDragging) {
      setProgress(newProg)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newProg = getProgressFromEvent(e.clientX)
      setProgress(newProg)
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

  return (
    <Card className="group relative overflow-hidden w-full max-w-2xl rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 py-3.5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer duration-200 ease-in-out">
      {/* Header section: Podcast Name */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          {podcastName}
        </span>
      </div>

      {/* Main Content: Thumbnail and Title details */}
      <div className="flex items-start gap-4 mt-2">
        <button 
          className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
        >
          <img
            src={imageUrl}
            alt={title}
            className={`object-cover w-full h-full opacity-95 transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
          />
          {/* Play Button Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-black/40' : 'bg-black/20 group-hover:bg-black/40'}`}>
            <div className={`backdrop-blur-sm rounded-full p-2 transition-all duration-300 shadow-sm ${isPlaying ? 'bg-white/20 scale-110' : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-110'}`}>
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-col pt-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1 truncate">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
            <span className={`font-mono tracking-tight transition-colors ${hoverProgress !== null && !isDragging ? 'text-blue-400 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'}`}>
              {dynamicTimeString}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span>{totalTimeString}</span>
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div 
        role="slider"
        aria-label="Seek podcast progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        tabIndex={0}
        className="mt-4 mb-0.5 px-0.5 text-slate-400 dark:text-slate-500 cursor-pointer py-2 -my-2 relative group-hover:opacity-100 opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setProgress(Math.min(100, progress + 5))
          if (e.key === 'ArrowLeft') setProgress(Math.max(0, progress - 5))
        }}
        ref={progressRef}
      >
        <Progress
          value={progress}
          className="h-2 bg-slate-100 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-500 dark:[&>[data-slot=progress-indicator]]:bg-blue-400 shadow-sm transition-all group-hover:h-2.5"
        />
      </div>
    </Card>
  )
}
