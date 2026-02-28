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

  const handleSubmit = useCallback(async () => {
    if (text.trim()) {
      onSubmit?.(text.trim());

      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: text.trim() }),
        });

        if (!response.ok) {
          console.error("Failed to submit query");
        }

        const data = await response.json();
        console.log("Query submitted successfully:", data);

        setText("");
      } catch (error) {
        console.error("Error submitting query:", error);
      }
    }
  }, [text, onSubmit]);

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
          apiEndpoint={apiEndpoint}
          onSuccess={handleTranscriptionSuccess}
        />
        <Button
          variant="default"
          size="sm"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="gap-1"
        >
          <span>Submit</span>
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default QueryBlock;
