"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Play, Pause, Loader2, Volume2, VolumeX } from "lucide-react"
import {
  ScrubBarContainer,
  ScrubBarTrack,
  ScrubBarProgress,
  ScrubBarThumb,
} from "@/components/ui/scrub-bar"
import type { IPodcast } from "@/types/podcast"
import { useAudioPlayer } from "@/stores/useAudioPlayer"

function formatSecondsToTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface FullPodcastCardHandle {
  play: () => void;
}

interface FullPodcastCardProps {
  podcast: IPodcast;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const FullPodcastCard = React.forwardRef<FullPodcastCardHandle, FullPodcastCardProps>(
  function FullPodcastCard({ podcast, autoPlay, onEnded }, ref) {
    const { name, src, duration, cover_image, start_time, highlights, description, pub_date_ms, podcast_title, publisher } = podcast
    const totalSeconds = duration || 1

    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(start_time || 0)
    const [volume, setVolume] = React.useState(1)
    const [isMuted, setIsMuted] = React.useState(false)
    const [showVolume, setShowVolume] = React.useState(false)
    const isScrubbing = React.useRef(false)
    const scrubTarget = React.useRef(start_time || 0)
    const playerRef = React.useRef<HTMLDivElement | null>(null)
    const hasAutoPlayedRef = React.useRef(false)
    const globalPlay = useAudioPlayer((s) => s.play)
    const globalPause = useAudioPlayer((s) => s.pause)
    const setCardVisible = useAudioPlayer((s) => s.setCardVisible)
    const meta = React.useMemo(() => ({ name, coverImage: cover_image, duration: totalSeconds }), [name, cover_image, totalSeconds])

    const playableItem = React.useCallback(() => ({
      id: src,
      type: "episode" as const,
      audio: audioRef.current!,
      meta,
    }), [src, meta])

    const startPlayback = React.useCallback(async () => {
      const audio = audioRef.current
      if (!audio) return
      globalPlay(playableItem())
      setIsLoading(true)
      try {
        await audio.play()
      } catch (err) {
        console.error("Playback failed:", err)
      }
      setIsLoading(false)
    }, [globalPlay, playableItem])

    React.useImperativeHandle(ref, () => ({ play: startPlayback }), [startPlayback])

    // Create audio element once
    React.useEffect(() => {
      const audio = new Audio(src)
      audio.preload = "metadata"
      audio.volume = volume
      if (start_time) audio.currentTime = start_time
      audioRef.current = audio

      const onTimeUpdate = () => {
        if (!isScrubbing.current) {
          setCurrentTime(audio.currentTime)
        }
      }
      const onPlay = () => setIsPlaying(true)
      const onPause = () => setIsPlaying(false)
      const onWaiting = () => setIsLoading(true)
      const onCanPlay = () => setIsLoading(false)
      const onEndedHandler = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        globalPause()
        onEnded?.()
      }

      audio.addEventListener("timeupdate", onTimeUpdate)
      audio.addEventListener("play", onPlay)
      audio.addEventListener("pause", onPause)
      audio.addEventListener("waiting", onWaiting)
      audio.addEventListener("canplay", onCanPlay)
      audio.addEventListener("ended", onEndedHandler)

      return () => {
        audio.removeEventListener("timeupdate", onTimeUpdate)
        audio.removeEventListener("play", onPlay)
        audio.removeEventListener("pause", onPause)
        audio.removeEventListener("waiting", onWaiting)
        audio.removeEventListener("canplay", onCanPlay)
        audio.removeEventListener("ended", onEndedHandler)
        audio.pause()
        audio.src = ""
      }
    }, [src, start_time])

    // Auto-play on mount
    React.useEffect(() => {
      if (autoPlay && !hasAutoPlayedRef.current && audioRef.current) {
        hasAutoPlayedRef.current = true
        // Small delay to let audio element initialize
        const timer = setTimeout(() => startPlayback(), 100)
        return () => clearTimeout(timer)
      }
    }, [autoPlay, startPlayback])

    // Sync volume changes
    React.useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume
      }
    }, [volume, isMuted])

    // Track card visibility for the off-screen sticky player
    React.useEffect(() => {
      const card = playerRef.current
      if (!card || !isPlaying) return

      const observer = new IntersectionObserver(
        ([entry]) => setCardVisible(src, entry.isIntersecting),
        { threshold: 0.1 }
      )
      observer.observe(card)
      return () => observer.disconnect()
    }, [isPlaying, src, setCardVisible])

    // Listen for external pause (another item started playing)
    React.useEffect(() => {
      const unsub = useAudioPlayer.subscribe((state, prev) => {
        if (prev.activeItem?.id === src && state.activeItem?.id !== src) {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause()
          }
        }
      })
      return unsub
    }, [src])

    const togglePlay = async (e: React.MouseEvent) => {
      e.stopPropagation()
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.pause()
        globalPause()
      } else {
        await startPlayback()
      }
    }

    const handleScrub = (time: number) => {
      scrubTarget.current = time
      setCurrentTime(time)
    }

    const handleScrubStart = () => {
      isScrubbing.current = true
    }

    const handleScrubEnd = () => {
      isScrubbing.current = false
      if (audioRef.current) {
        audioRef.current.currentTime = scrubTarget.current
        globalPlay(playableItem())
        audioRef.current.play().catch(() => {})
      }
    }

    const seekTo = (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time
        setCurrentTime(time)
        globalPlay(playableItem())
        audioRef.current.play().catch(() => {})
      }
    }

    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsMuted(!isMuted)
    }

    const dynamicTimeString = formatSecondsToTime(currentTime)

    return (
      <Card className="group relative w-full max-w-2xl rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer duration-200 ease-in-out">
        {/* Player controls */}
        <div ref={playerRef} className="p-4 pb-2">
          {/* Thumbnail and Title */}
          <div className="flex items-start gap-4">
            <button
              className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
            >
              <img
                src={cover_image}
                alt={name}
                className={`object-cover w-full h-full opacity-95 transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
              />
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-black/40' : 'bg-black/20 group-hover:bg-black/40'}`}>
                <div className={`backdrop-blur-sm rounded-full p-2 transition-all duration-300 shadow-sm ${isPlaying ? 'bg-white/20 scale-110' : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-110'}`}>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  )}
                </div>
              </div>
            </button>

            <div className="flex flex-col pt-1 min-w-0 flex-1">
              <h3 className="font-semibold text-lg leading-tight text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all duration-300 group-hover:translate-x-1 truncate">
                {name}
              </h3>
              {(podcast_title || publisher || pub_date_ms) && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                  {podcast_title}
                  {podcast_title && publisher && " · "}
                  {publisher}
                  {(podcast_title || publisher) && pub_date_ms && " · "}
                  {pub_date_ms && new Date(pub_date_ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </p>
              )}
            </div>

            {/* Volume control */}
            <div
              className="relative shrink-0 flex items-center"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button
                onClick={toggleMute}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              {showVolume && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value))
                    setIsMuted(false)
                  }}
                  className="w-20 h-1 ml-1 accent-slate-800 dark:accent-slate-200 cursor-pointer"
                  aria-label="Volume"
                />
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-4 mb-0.5 relative group-hover:opacity-100 opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-900 dark:text-slate-100 tabular-nums shrink-0 w-10">
                {dynamicTimeString}
              </span>
              <div className="flex-1 relative">
                <ScrubBarContainer
                  duration={totalSeconds}
                  value={currentTime}
                  onScrub={handleScrub}
                  onScrubStart={handleScrubStart}
                  onScrubEnd={handleScrubEnd}
                >
                  <ScrubBarTrack className="bg-slate-200 dark:bg-slate-800 h-1 rounded-full transition-all duration-300 before:content-[''] before:absolute before:inset-x-0 before:-inset-y-3">
                    <ScrubBarProgress className="bg-slate-800 dark:bg-slate-200 z-10 rounded-full" />
                    <ScrubBarThumb className="bg-slate-900 dark:bg-slate-100 h-3.5 w-3.5 shadow-sm z-20" />
                  </ScrubBarTrack>
                </ScrubBarContainer>
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0 w-10 text-right">
                {formatSecondsToTime(totalSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mx-4 mb-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="mx-4 mb-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-0.5">
            {highlights.map((h, i) => {
              const isActive = currentTime >= h.timestamp &&
                (i === highlights.length - 1 || currentTime < highlights[i + 1].timestamp)
              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); seekTo(h.timestamp) }}
                  className={`flex items-start gap-3 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className={`text-xs font-mono tabular-nums shrink-0 mt-px ${
                    isActive
                      ? "text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {formatSecondsToTime(h.timestamp)}
                  </span>
                  {h.text && (
                    <span className={`text-sm leading-snug ${
                      isActive
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {h.text}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </Card>
    )
  }
)
