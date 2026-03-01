"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface MessageTTSProps {
  text: string;
  autoPlay?: boolean;
  voiceId?: string;
}

function MockWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-3">
      {Array.from({ length: 12 }).map((_, i) => {
        const heights = [40, 65, 30, 80, 50, 90, 45, 70, 35, 60, 75, 40];
        return (
          <div
            key={i}
            className={`w-[2px] rounded-full transition-all duration-300 ${
              active ? "bg-black/40 animate-pulse" : "bg-black/15"
            }`}
            style={{
              height: `${heights[i]}%`,
              animationDelay: active ? `${i * 80}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export function MessageTTS({ text, autoPlay, voiceId }: MessageTTSProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const hasAutoPlayedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = cleanup;
      audio.onerror = cleanup;

      setIsPlaying(true);
      await audio.play();
    } catch {
      cleanup();
    } finally {
      setIsLoading(false);
    }
  }, [text, voiceId, cleanup]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      cleanup();
    } else {
      play();
    }
  }, [isPlaying, cleanup, play]);

  // Auto-play on mount when in voice mode (once only)
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current && text.trim()) {
      hasAutoPlayedRef.current = true;
      play();
    }
  }, [autoPlay, text, play]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  if (!text.trim()) return null;

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className="flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded hover:bg-black/[0.04] transition-colors cursor-pointer disabled:cursor-wait group"
    >
      {isLoading ? (
        <Loader2 className="size-3 text-black/25 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="size-3 text-black/40" />
      ) : (
        <Volume2 className="size-3 text-black/20 group-hover:text-black/40 transition-colors" />
      )}
      <MockWaveform active={isPlaying} />
    </button>
  );
}
