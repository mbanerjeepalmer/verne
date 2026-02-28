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
  apiEndpoint?: string;
  onSuccess?: (response: unknown) => void;
  onError?: (error: Error) => void;
}

export function SpeechInput({
  apiEndpoint = "/api/audio",
  onSuccess,
  onError,
}: AudioRecorderProps) {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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

  // startRecording - starts the recording process
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Create blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Upload the blob
        await uploadAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStatus("recording");
      startTimer();
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("error");
      onError?.(
        error instanceof Error ? error : new Error("Failed to start recording"),
      );
    }
  }, [startTimer, onError]);

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

  // uploadAudio - uploads the recorded audio to the server
  const uploadAudio = async (blob: Blob) => {
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      setStatus("idle");
      onSuccess?.(data);
    } catch (error) {
      console.error("Error uploading audio:", error);
      setStatus("error");
      onError?.(
        error instanceof Error ? error : new Error("Failed to upload audio"),
      );
    }
  };

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
