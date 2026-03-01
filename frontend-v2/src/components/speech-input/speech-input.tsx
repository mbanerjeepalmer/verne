"use client";

import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Mic } from "lucide-react";
import { LiveWaveform } from "@/components/ui/live-waveform";

type AudioRecorderStatus =
  | "idle"
  | "recording"
  | "uploading"
  | "error"
  | "success";

export interface SpeechInputHandle {
  stopRecording: () => void;
}

interface AudioRecorderProps {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Convert Float32 audio samples to Int16 PCM
 */
function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

/** Returns true when the event target is a focusable text element, so we skip hotkeys while typing. */
function isTypingFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    (active as HTMLElement).contentEditable === "true"
  );
}

export const SpeechInput = forwardRef<SpeechInputHandle, AudioRecorderProps>(function SpeechInput({
  onTranscript,
  onError,
}, ref) {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  // Keep latest status accessible inside stable event listeners
  const statusRef = useRef(status);
  statusRef.current = status;

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // startRecording - captures PCM audio via Web Audio API and streams to backend
  const startRecording = useCallback(async () => {
    try {
      // Close any leftover WebSocket from a previous attempt
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent stale onclose from clobbering state
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }

      // Connect to backend WebSocket
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001";
      const ws = new WebSocket(`${wsUrl}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[SpeechInput] WebSocket connected");
        ws.send(JSON.stringify({ type: "transcription.start" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "transcription.delta") {
            onTranscript?.(data.text, false);
          } else if (data.type === "transcription.done") {
            onTranscript?.(data.text, true);
            setStatus("idle");
            ws.close();
          } else if (data.type === "error") {
            console.error("[SpeechInput] Error:", data.message);
            setStatus("error");
            onError?.(new Error(data.message));
            ws.close();
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

      // Get microphone access with PCM-friendly settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Use Web Audio API to capture PCM directly (no ffmpeg needed)
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = floatTo16BitPCM(inputData);
          ws.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

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

  // stopRecording - cleans up audio pipeline and sends stop signal
  const stopRecording = useCallback(() => {
    stopTimer();

    // Disconnect audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Send stop signal to trigger transcription
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "transcription.stop" }));
      setStatus("uploading");

      // Timeout fallback: if backend never responds, reset to idle
      const ws = wsRef.current;
      const timeout = setTimeout(() => {
        console.warn("[SpeechInput] Transcription timed out after 15s");
        ws.onclose = null;
        ws.close();
        setStatus("idle");
      }, 15000);

      // Clear timeout once a response arrives (done or error)
      const origOnMessage = ws.onmessage;
      ws.onmessage = (event) => {
        clearTimeout(timeout);
        origOnMessage?.call(ws, event);
      };
    }
  }, [stopTimer]);

  useImperativeHandle(ref, () => ({ stopRecording }), [stopRecording]);

  // handleClick - handles the click event for the microphone button
  const handleClick = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle" || status === "error") {
      startRecording();
    }
  };

  // Hold V → push-to-talk (starts on keydown, stops on keyup)
  // Outside text fields: plain V. Inside text fields: Shift+V.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyV" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isTypingFocused()) return;
      e.preventDefault();
      if (statusRef.current === "idle" || statusRef.current === "error") {
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyV") return;
      if (statusRef.current === "recording") {
        stopRecording();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [startRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      {status === "idle" && (
        <button
          className="flex items-center gap-1.5 border px-2 p-1 rounded-md hover:bg-muted cursor-pointer"
          onClick={handleClick}
          title="Record voice (hold V to talk)"
        >
          <Mic className="size-4" />
          <p className="text-sm">Record Voice</p>
          <kbd className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono border border-black/20 bg-black/5 text-black/40 leading-none ml-0.5">
            V
          </kbd>
        </button>
      )}

      {status === "recording" && (
        <button
          className="flex items-center gap-3 border px-2 p-1 rounded-md hover:bg-muted cursor-pointer"
          onClick={handleClick}
          title="Stop recording (release V)"
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
          <div className="flex items-center gap-1.5">
            <p className="text-sm">Recording {formatTime(recordingTime)}</p>
            <kbd className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono border border-black/20 bg-black/5 text-black/40 leading-none">
              V
            </kbd>
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
});
