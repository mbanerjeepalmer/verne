"use client"

import * as React from "react"
import { Play, Pause } from "lucide-react"
import { useAudioPlayer } from "@/stores/useAudioPlayer"

function formatSecondsToTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function StickyPlayer() {
  const { activeAudio, activeMeta, activeEpisodeId, isCardVisible } = useAudioPlayer()
  const [currentTime, setCurrentTime] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const visible = !!(activeEpisodeId && activeMeta && activeAudio && !isCardVisible)

  React.useEffect(() => {
    const audio = activeAudio
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    // Sync initial state
    setCurrentTime(audio.currentTime)
    setIsPlaying(!audio.paused)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [activeAudio])

  const duration = activeMeta?.duration || 1
  const progress = activeAudio ? (currentTime / duration) * 100 : 0

  const togglePlay = () => {
    if (!activeAudio) return
    if (isPlaying) {
      activeAudio.pause()
    } else {
      activeAudio.play().catch(() => {})
    }
  }

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: visible ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div className="relative border-t border-black/[0.06] bg-white/95 backdrop-blur-sm px-6 py-2">
          {/* Thin progress bar at top edge */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100">
            <div
              className="h-full bg-slate-800 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Cover image */}
            {activeMeta && (
              <img
                src={activeMeta.coverImage}
                alt={activeMeta.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="shrink-0 p-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" fill="currentColor" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Title + time */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">
                {activeMeta?.name}
              </p>
              <p className="text-xs font-mono text-slate-400 tabular-nums">
                {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
