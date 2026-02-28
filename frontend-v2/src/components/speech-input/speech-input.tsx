"use client";

import { useCallback, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { LiveWaveform } from "@/components/ui/live-waveform";

type AudioRecorderStatus =
  | "idle"
  | "recording"
  | "uploading"
  | "error"
  | "success";

interface AudioRecorderProps {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export function SpeechInput({
  onTranscript,
  onError,
}: AudioRecorderProps) {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // startTimer - starts the recording timer
  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  // stopTimer - stops the recording timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // formatTime - formats the recording time in the format "mm:ss"
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // startRecording - starts the recording process with WebSocket streaming
  const startRecording = useCallback(async () => {
    try {
      // Connect to existing WebSocket
      const ws = new WebSocket("ws://localhost:3001/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[SpeechInput] WebSocket connected");
        // Send start signal for transcription
        ws.send(JSON.stringify({ type: "transcription.start" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "transcription.delta") {
            // Real-time text delta
            onTranscript?.(data.text, false);
          } else if (data.type === "transcription.done") {
            // Final transcription
            onTranscript?.(data.text, true);
            setStatus("success");
          } else if (data.type === "error") {
            console.error("[SpeechInput] Error:", data.message);
            setStatus("error");
            onError?.(new Error(data.message));
          } else if (data.type === "ready") {
            console.log("[SpeechInput] Server ready");
          }
        } catch (error) {
          console.error("[SpeechInput] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[SpeechInput] WebSocket error:", error);
        setStatus("error");
        onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = () => {
        console.log("[SpeechInput] WebSocket closed");
        setStatus("idle");
      };

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          // Send audio chunks in real-time as they're available
          event.data.arrayBuffer().then(buffer => {
            ws.send(buffer);
          });
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Send stop signal to process transcription
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "transcription.stop" }));
          setStatus("uploading");
        }
      };

      mediaRecorderRef.current = mediaRecorder;

      // Request data every 100ms for real-time streaming
      mediaRecorder.start(100);
      setStatus("recording");
      startTimer();
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("error");
      onError?.(
        error instanceof Error ? error : new Error("Failed to start recording"),
      );
    }
  }, [startTimer, onError, onTranscript]);

  // stopRecording - stops the recording process
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
  }, [stopTimer]);

  // handleClick - handles the click event for the microphone button
  const handleClick = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle" || status === "error") {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {status === "idle" && (
        <button
          className="flex items-center gap-1 border px-2 p-1 rounded-md hover:bg-muted cursor-pointer"
          onClick={handleClick}
        >
          <Mic className="size-4" />
          <p className="text-sm">Record Voice</p>
        </button>
      )}

      {status === "recording" && (
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

      {status === "uploading" && (
        <button
          className="flex items-center gap-2 border px-2 p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={true}
        >
          <p className="text-sm">Transcribing voice...</p>
        </button>
      )}
    </div>
  );
}
