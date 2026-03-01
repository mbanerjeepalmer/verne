"use client";

import VerneLogo from "@/components/icons/verne-logo";
import { FullPodcastCard } from "@/components/full-podcast-card";
import QueryBlock from "@/components/query-block/query-block";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_EPISODES } from "@/data/mock-episodes";
import { StickyPlayer } from "@/components/sticky-player";

export default function ChatPage() {
  const { messages, clearMessages, setMessage, addMessage } =
    usePodcasts();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDevMode = searchParams.has("dev");

  // Auto-submit query from URL param (coming from landing page)
  const initialQuerySubmitted = useRef(false);
  useEffect(() => {
    if (isDevMode && !initialQuerySubmitted.current) {
      initialQuerySubmitted.current = true;
      addMessage({ role: "assistant", content: "", type: "episodes", episodes: MOCK_EPISODES });
      return;
    }

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
  }, [searchParams, addMessage, router, isDevMode]);

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
          <button
            onClick={handleNewConversation}
            className="text-[13px] font-medium text-black/50 hover:text-black transition-colors cursor-pointer"
          >
            New conversation
          </button>
        </div>
      </nav>

      {/* Sticky player (when player controls scroll out of view) */}
      <StickyPlayer />

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
                className="p-3 rounded-lg text-[15px] leading-relaxed bg-black/[0.04] text-black/70 self-start max-w-[85%]"
              >
                {msg.content}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <QueryBlock />
        </div>
      </div>
    </div>
  );
}
