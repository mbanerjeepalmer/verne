import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Square } from "lucide-react";

interface TextToSpeechProps {
  text: string;
  voiceId?: string;
  className?: string;
}

const TTSPlayer = ({ text, voiceId, className }: TextToSpeechProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const handleSpeak = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      cleanup();
      return;
    }

    if (!text.trim()) {
      setError("No text to speak");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = cleanup;
      audio.onerror = () => {
        setError("Failed to play audio");
        cleanup();
      };

      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate speech",
      );
      cleanup();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSpeak}
        disabled={isLoading || !text.trim()}
        variant="outline"
        size="sm"
        className={className}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <Square className="size-4" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="size-4" />
            <span>Play</span>
          </>
        )}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};

export default TTSPlayer;
