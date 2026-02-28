"use client";

import { useCallback, useState } from "react";
import { Mic } from "lucide-react";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { useVoxtralStreaming } from "@/hooks/useVoxtralStreaming";

interface SpeechInputStreamingProps {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export function SpeechInputStreaming({
  onTranscript,
  onError,
}: SpeechInputStreamingProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const { startStreaming, stopStreaming, isStreaming } = useVoxtralStreaming({
    onTranscript: (text, isFinal) => {
      console.log('[SpeechInput]', isFinal ? 'Final:' : 'Delta:', text);
      onTranscript?.(text, isFinal);
    },
    onError: (error) => {
      console.error('[SpeechInput] Error:', error);
      onError?.(error);
      stopTimer();
    },
  });

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerInterval]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = async () => {
    if (isStreaming) {
      stopStreaming();
      stopTimer();
    } else {
      await startStreaming();
      startTimer();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isStreaming && (
        <button
          className="flex items-center gap-1 border px-2 p-1 rounded-md hover:bg-muted cursor-pointer"
          onClick={handleClick}
        >
          <Mic className="size-4" />
          <p className="text-sm">Record Voice</p>
        </button>
      )}

      {isStreaming && (
        <button
          className="flex items-center gap-3 border px-2 p-1 rounded-md hover:bg-muted cursor-pointer"
          onClick={handleClick}
        >
          <div className="w-12 h-4 shrink-0">
            <LiveWaveform
              active={true}
              barWidth={2}
              barGap={1.5}
              height={16}
              barColor="currentColor"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className="text-sm">Recording {formatTime(recordingTime)}</p>
          </div>
        </button>
      )}
    </div>
  );
}
