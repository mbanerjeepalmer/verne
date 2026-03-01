"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { usePodcasts } from "@/stores/usePodcasts";
import { useAudioPlayer } from "@/stores/useAudioPlayer";

interface MessageTTSProps {
  text: string;
  autoPlay?: boolean;
  voiceId?: string;
  messageIndex: number;
  onEnded?: () => void;
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

export function MessageTTS({ text, autoPlay, voiceId, messageIndex, onEnded }: MessageTTSProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const { setVoiceMode } = usePodcasts();
  const globalPlay = useAudioPlayer((s) => s.play);
  const globalPause = useAudioPlayer((s) => s.pause);

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
      audio.onended = () => {
        cleanup();
        globalPause();
        onEnded?.();
      };
      audio.onerror = () => {
        cleanup();
        globalPause();
      };

      // Register with unified audio player (pauses any playing episode)
      const itemId = `tts-${messageIndex}`;
      globalPlay({
        id: itemId,
        type: "tts",
        audio,
        meta: { name: "Reading response aloud", duration: 0 },
      });

      setIsPlaying(true);
      setIsGlowing(true);
      await audio.play();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "TTS failed");
      cleanup();
    } finally {
      setIsLoading(false);
    }
  }, [text, voiceId, cleanup, globalPlay, globalPause, messageIndex, onEnded]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      cleanup();
      globalPause();
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      play();
    }
  }, [isPlaying, cleanup, play, setVoiceMode, globalPause]);

  // Auto-play on mount when in voice mode (once only)
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current && text.trim()) {
      hasAutoPlayedRef.current = true;
      play();
    }
  }, [autoPlay, text, play]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Listen for external pause (another item started playing)
  useEffect(() => {
    const unsub = useAudioPlayer.subscribe((state, prev) => {
      const itemId = `tts-${messageIndex}`;
      if (prev.activeItem?.id === itemId && state.activeItem?.id !== itemId) {
        // We were active but something else took over — stop our audio
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setIsGlowing(false);
        }
      }
    });
    return unsub;
  }, [messageIndex]);

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
