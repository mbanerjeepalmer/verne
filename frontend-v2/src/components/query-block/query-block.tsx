"use client";

import React, { useState, useCallback } from "react";
import { SpeechInput } from "../speech-input/speech-input";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import Spacer from "../spacer/spacer";

interface QueryBlockProps {
  onSubmit?: (text: string) => void;
  apiEndpoint?: string;
}

const QueryBlock = ({
  onSubmit,
  apiEndpoint = "/api/audio",
}: QueryBlockProps) => {
  const [text, setText] = useState("");

  const handleTranscriptionSuccess = useCallback((response: unknown) => {
    const result = response as { transcription?: string };
    if (result.transcription) {
      setText((prev) =>
        prev ? `${prev} ${result.transcription}` : (result.transcription ?? ""),
      );
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit?.(text.trim());
    }
  }, [text, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col rounded-lg">
      <div className="flex justify-between items-center">
        <SpeechInput
          apiEndpoint={apiEndpoint}
          onSuccess={handleTranscriptionSuccess}
        />
        <button
          className="flex items-center gap-1 border px-2 p-1 rounded-md bg-black text-white cursor-pointer hover:opacity-80"
          onClick={handleSubmit}
          disabled={true}
        >
          <p className="text-sm">Submit</p>
          <ArrowUpRight className="size-4" />
        </button>
      </div>
      <Spacer size="small" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your query or use voice input..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={4}
      />
    </div>
  );
};

export default QueryBlock;
