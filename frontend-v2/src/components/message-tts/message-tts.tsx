"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { usePodcasts } from "@/stores/usePodcasts";

interface MessageTTSProps {
  text: string;
  autoPlay?: boolean;
  voiceId?: string;
}

function MockWaveform({ active, glowing }: { active: boolean; glowing: boolean }) {
  const heights = [40, 65, 30, 80, 50, 90, 45, 70, 35, 60, 75, 40];
  return (
    <div className="flex items-center gap-[2px] h-3">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active ? "bg-current animate-pulse" : "bg-black/15"
          }`}
          style={{
            height: `${h}%`,
            color: active ? undefined : undefined,
            animation: glowing
              ? `voice-bar-glow 1.2s ease-in-out ${i * 60}ms forwards`
              : active
                ? `pulse 1.5s ease-in-out ${i * 80}ms infinite`
                : undefined,
            backgroundColor: glowing ? "currentColor" : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function MessageTTS({ text, autoPlay, voiceId }: MessageTTSProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const { setVoiceMode, setTTSPlaying } = usePodcasts();

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
    setTTSPlaying(false);
  }, [setTTSPlaying]);

  const play = useCallback(async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setIsGlowing(false);
    setError(null);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `TTS failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = cleanup;
      audio.onerror = cleanup;

      setIsPlaying(true);
      setTTSPlaying(true);
      setIsGlowing(true);
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "TTS failed");
      cleanup();
    } finally {
      setIsLoading(false);
    }
  }, [text, voiceId, cleanup, setTTSPlaying]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      cleanup();
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      play();
    }
  }, [isPlaying, cleanup, play, setVoiceMode]);

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
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={toggle}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-black/[0.04] transition-colors cursor-pointer disabled:cursor-wait group"
      >
        {isLoading ? (
          <Loader2 className="size-3 text-black/25 animate-spin" />
        ) : isPlaying ? (
          <VolumeX
            className="size-3"
            style={isGlowing ? {
              color: "oklch(0.55 0.22 270)",
              animation: "voice-bar-glow 1.2s ease-in-out forwards",
            } : { color: "oklch(0 0 0 / 0.4)" }}
          />
        ) : (
          <Volume2 className="size-3 text-black/20 group-hover:text-black/40 transition-colors" />
        )}
        <MockWaveform active={isPlaying} glowing={isGlowing} />
      </button>
      {error && (
        <span className="text-[11px] text-red-500/70">{error}</span>
      )}
    </div>
  );
}
