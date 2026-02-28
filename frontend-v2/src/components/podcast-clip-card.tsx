"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AudioLines, ExternalLink, Play, Pause, CornerDownLeft } from "lucide-react"
import {
  ScrubBarContainer,
  ScrubBarTrack,
  ScrubBarProgress,
  ScrubBarThumb,
} from "@/components/ui/scrub-bar"
import type { IPodcast } from "@/types/podcast"

function formatSecondsToTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface PodcastClipCardProps {
  podcast: IPodcast;
}

export function PodcastClipCard({ podcast }: PodcastClipCardProps) {
  const { name, duration, cover_image, start_time, end_time } = podcast
  const fullSec = duration || 1

  const clipLengthSec = end_time - start_time
  const leftOffset = Math.min(100, Math.max(0, (start_time / fullSec) * 100))
  const clipWidthPercent = Math.min(100 - leftOffset, (clipLengthSec / fullSec) * 100)

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentProgress, setCurrentProgress] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  const handleScrub = (time: number) => {
    setCurrentProgress((time / fullSec) * 100)
  }

  const handleScrubStart = () => {
    setIsDragging(true)
  }

  const handleScrubEnd = () => {
    setIsDragging(false)
    setIsPlaying(true)
  }

  const displayProgress = currentProgress !== null ? currentProgress : leftOffset
  const currentSeconds = (displayProgress / 100) * fullSec
  const dynamicTimeString = formatSecondsToTime(currentSeconds)

  const jumpBackToClip = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentProgress(leftOffset)
    setIsPlaying(true)
  }

  return (
    <Card className="group relative overflow-hidden w-full max-w-2xl rounded-xl shadow-sm border border-l-4 border-slate-200 border-l-slate-900 dark:border-slate-800 dark:border-l-slate-100 bg-white dark:bg-slate-950 p-4 py-3.5 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer duration-200 ease-in-out">
      {/* Header section: Badge and clip info */}
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-none"
        >
          <AudioLines className="w-3.5 h-3.5" />
          CLIP
        </Badge>
        <span className="text-sm text-muted-foreground dark:text-slate-400 font-medium flex-1">
          {formatSecondsToTime(clipLengthSec)} from <span className="text-slate-700 dark:text-slate-300">{name}</span>
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 ml-auto"
          onClick={jumpBackToClip}
        >
          <CornerDownLeft className="w-3 h-3 mr-1" />
          Back to clip
        </Button>
      </div>

      {/* Main Content: Thumbnail and Title */}
      <div className="flex items-start gap-4 mt-3">
        <button 
          className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
        >
          <img
            src={cover_image}
            alt={name}
            className={`object-cover w-full h-full opacity-90 transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
          />
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
          <h3 className="font-semibold text-[17px] leading-tight text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all duration-300 group-hover:translate-x-1 truncate">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1.5">
            @ {formatSecondsToTime(start_time)} <span className="mx-1">&middot;</span> {formatSecondsToTime(clipLengthSec)}
          </p>
        </div>
      </div>

      {/* Progress Section — inline: time | bar | time */}
      <div className="mt-3.5 relative group-hover:opacity-100 opacity-90 transition-opacity">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-900 dark:text-slate-100 tabular-nums shrink-0 w-10">
            {dynamicTimeString}
          </span>
          <div className="flex-1 relative">
            <ScrubBarContainer
              duration={fullSec}
              value={currentSeconds}
              onScrub={handleScrub}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            >
              <ScrubBarTrack className="bg-slate-200 dark:bg-slate-800 h-1 rounded-full transition-all duration-300 before:content-[''] before:absolute before:inset-x-0 before:-inset-y-3">
                {/* Clip region within the full episode */}
                <div 
                  className="absolute top-0 bottom-0 bg-slate-400 dark:bg-slate-500 rounded-full z-0 pointer-events-none"
                  style={{ left: `${leftOffset}%`, width: `${clipWidthPercent}%` }}
                />
                {/* Clip boundary tick marks */}
                <div 
                  className="absolute -top-1 -bottom-1 w-px bg-slate-500 dark:bg-slate-400 z-0 pointer-events-none"
                  style={{ left: `${leftOffset}%` }}
                />
                <div 
                  className="absolute -top-1 -bottom-1 w-px bg-slate-500 dark:bg-slate-400 z-0 pointer-events-none"
                  style={{ left: `${leftOffset + clipWidthPercent}%` }}
                />
                <ScrubBarProgress className="bg-slate-800 dark:bg-slate-200 z-10 rounded-full" />
                <ScrubBarThumb className="bg-slate-900 dark:bg-slate-100 h-3.5 w-3.5 shadow-sm z-20" />
              </ScrubBarTrack>
            </ScrubBarContainer>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0 w-10 text-right">
            {formatSecondsToTime(fullSec)}
          </span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-2.5">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Listen to full episode
        </a>
      </div>
    </Card>
  )
}
