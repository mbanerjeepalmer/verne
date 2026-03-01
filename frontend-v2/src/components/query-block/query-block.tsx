"use client";

import React, { useState, useCallback, useRef } from "react";
import { SpeechInput } from "../speech-input/speech-input";
import { ArrowUpRight } from "lucide-react";
import Spacer from "../spacer/spacer";
import { usePodcasts } from "@/stores/usePodcasts";
import { useAudioPlayer } from "@/stores/useAudioPlayer";

interface QueryBlockProps {
  onSubmit?: (text: string) => void;
  /** If true, only calls onSubmit — skips the API call and message store */
  navigateOnly?: boolean;
}

const QueryBlock = ({
  onSubmit,
  navigateOnly,
}: QueryBlockProps) => {
  const [text, setText] = useState("");
  const partialTextRef = useRef("");
  const baseTextRef = useRef("");
  const { addMessage, setVoiceMode, messages } = usePodcasts();
  const { activeEpisodeId, activeAudio, activeMeta } = useAudioPlayer();

  // Handle real-time transcription (text deltas and final)
  // Auto-enable voice mode when user starts speaking
  const handleTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
    setVoiceMode(true);
    if (isFinal) {
      // Final transcription - replace partial with final text
      const base = baseTextRef.current;
      const finalText = base ? `${base} ${transcriptText}` : transcriptText;
      partialTextRef.current = "";
      baseTextRef.current = "";
      setText(finalText);
    } else {
      // On first delta, capture the current text as the base
      if (!partialTextRef.current) {
        setText((currentText) => {
          baseTextRef.current = currentText;
          partialTextRef.current = transcriptText;
          return currentText ? `${currentText} ${transcriptText}` : transcriptText;
        });
      } else {
        // Subsequent deltas: rebuild as base + accumulated partial
        partialTextRef.current += transcriptText;
        const base = baseTextRef.current;
        setText(base ? `${base} ${partialTextRef.current}` : partialTextRef.current);
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (text.trim()) {
      const query = text.trim();
      setText("");

      if (navigateOnly) {
        onSubmit?.(query);
        return;
      }

      addMessage({ role: "user", content: query });
      onSubmit?.(query);

      // Build listening context for the agent
      const context: Record<string, unknown> = {};
      if (activeEpisodeId && activeAudio && activeMeta) {
        context.currentEpisode = {
          name: activeMeta.name,
          currentTime: Math.floor(activeAudio.currentTime),
          duration: activeMeta.duration,
          paused: activeAudio.paused,
        };
      }
      // Collect episode names from the conversation so the agent knows what's been discussed
      const episodeNames = messages
        .filter((m) => m.type === "episodes" && m.episodes)
        .flatMap((m) => m.episodes!.map((e) => e.name));
      if (episodeNames.length > 0) {
        context.conversationEpisodes = episodeNames;
      }

      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            ...(Object.keys(context).length > 0 && { context }),
          }),
        });

        if (!response.ok) {
          console.error("Failed to submit query");
        }

        const data = await response.json();
        console.log("Query submitted successfully:", data);
      } catch (error) {
        console.error("Error submitting query:", error);
      }
    }
  }, [text, onSubmit, navigateOnly, addMessage, activeEpisodeId, activeAudio, activeMeta, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col rounded-lg border border-border p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your query or use voice input..."
        className="w-full min-h-20 resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        rows={3}
      />
      <Spacer size="small" />
      <div className="flex justify-between items-center">
        <SpeechInput
          onTranscript={handleTranscript}
        />
        <button
          className="flex items-center gap-1 border px-2 p-1 rounded-md bg-black text-white cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          <p className="text-sm">Submit</p>
          <ArrowUpRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default QueryBlock;
