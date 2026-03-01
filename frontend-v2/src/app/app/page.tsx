"use client";

import VerneLogo from "@/components/icons/verne-logo";
import { FullPodcastCard } from "@/components/full-podcast-card";
import { MessageTTS } from "@/components/message-tts/message-tts";
import QueryBlock from "@/components/query-block/query-block";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";
import { useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";

export default function ChatPage() {
  const { messages, clearMessages, setMessage, addMessage, isVoiceMode, setVoiceMode } =
    usePodcasts();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Auto-submit query from URL param (coming from landing page)
  const initialQuerySubmitted = useRef(false);
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || initialQuerySubmitted.current) return;
    initialQuerySubmitted.current = true;

    addMessage({ role: "user", content: q });
    router.replace("/app", { scroll: false });

    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    }).catch((error) => console.error("Error submitting initial query:", error));
  }, [searchParams, addMessage, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      await fetch("/api/sandbox/restart", { method: "POST" });
    } catch (err) {
      console.error("Failed to restart sandbox:", err);
    }
    clearMessages();
    setMessage(null);
    router.push("/");
  };

  // Find the last assistant text message for voice-mode auto-play
  const lastAssistantIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && (!m.type || m.type === "assistant") && m.content.trim()) {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
      <Websocket />

      {/* Navigation */}
      <nav className="shrink-0 bg-white/80 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <VerneLogo className="size-5" />
            <span className="text-[15px] font-semibold tracking-tight">
              Verne
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVoiceMode(!isVoiceMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                isVoiceMode
                  ? "bg-black text-white"
                  : "text-black/40 hover:text-black/60"
              }`}
              title={isVoiceMode ? "Voice mode on — click to mute" : "Voice mode off — click to read responses aloud"}
            >
              {isVoiceMode ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              <span>Voice</span>
            </button>
            <button
              onClick={handleNewConversation}
              className="text-[13px] font-medium text-black/50 hover:text-black transition-colors cursor-pointer"
            >
              New conversation
            </button>
          </div>
        </div>
      </nav>

      {/* Scrollable messages + podcast cards */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div
                  key={i}
                  className="p-3 rounded-lg text-[15px] leading-relaxed bg-black text-white self-end max-w-[85%] ml-auto"
                >
                  {msg.content}
                </div>
              );
            }

            if (msg.type === "reasoning") {
              return (
                <div
                  key={i}
                  data-msg-type="reasoning"
                  className="px-3 py-1.5 text-[13px] leading-relaxed text-black/35 italic self-start max-w-[85%]"
                >
                  {msg.content}
                </div>
              );
            }

            if (msg.type === "tool_call" || msg.type === "tool_result") {
              return (
                <details
                  key={i}
                  data-msg-type={msg.type}
                  className="px-3 py-1 text-[12px] font-mono text-black/30 self-start max-w-[85%]"
                >
                  <summary className="cursor-pointer truncate">
                    {msg.content}
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap break-words max-h-60 overflow-y-auto text-black/40">
                    {msg.content}
                  </pre>
                </details>
              );
            }

            if (msg.type === "episodes" && msg.episodes) {
              return (
                <div key={i} className="flex flex-col gap-4 self-start w-full">
                  {msg.episodes.map((episode, j) => (
                    <FullPodcastCard key={j} podcast={episode} />
                  ))}
                </div>
              );
            }

            if (msg.type === "error") {
              return (
                <div
                  key={i}
                  className="p-3 rounded-lg text-[15px] leading-relaxed bg-red-50 text-red-600 self-start max-w-[85%]"
                >
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={i}
                className="self-start max-w-[85%]"
              >
                <div className="p-3 rounded-lg text-[15px] leading-relaxed bg-black/[0.04] text-black/70">
                  {msg.content}
                </div>
                <MessageTTS
                  text={msg.content}
                  autoPlay={isVoiceMode && i === lastAssistantIdx}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky input at bottom */}
      <div className="shrink-0 border-t border-black/[0.06] bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <QueryBlock />
        </div>
      </div>
    </div>
  );
}
