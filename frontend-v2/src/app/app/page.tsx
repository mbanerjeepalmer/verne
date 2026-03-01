"use client";

import VerneLogo from "@/components/icons/verne-logo";
import { FullPodcastCard, FullPodcastCardHandle } from "@/components/full-podcast-card";
import { MessageTTS } from "@/components/message-tts/message-tts";
import QueryBlock from "@/components/query-block/query-block";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";
import { useAudioPlayer } from "@/stores/useAudioPlayer";
import { Suspense, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_EPISODES } from "@/data/mock-episodes";
import { StickyPlayer } from "@/components/sticky-player";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import Markdown from "react-markdown";

// Message types that should trigger auto-scroll
const SCROLL_TYPES = new Set<string | undefined>([undefined, "assistant", "episodes", "error"]);

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { messages, clearMessages, setMessage, addMessage, isVoiceMode, setVoiceMode, isProcessing, setProcessing } =
    usePodcasts();
  const activeItem = useAudioPlayer((s) => s.activeItem);
  const isTTSPlaying = activeItem?.type === "tts";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDevMode = searchParams.has("dev");

  // Refs for sequential episode playback
  const episodeRefsMap = useRef<Map<string, FullPodcastCardHandle>>(new Map());

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
    setProcessing(true);
    router.replace("/app", { scroll: false });

    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    }).catch((error) => console.error("Error submitting initial query:", error));
  }, [searchParams, addMessage, router, isDevMode, setProcessing]);

  // Smart scroll: only on meaningful messages
  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const latest = messages[messages.length - 1];
      const shouldScroll = latest.role === "user" || SCROLL_TYPES.has(latest.type);
      if (shouldScroll) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessageCountRef.current = messages.length;
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

  // Build a flat playlist of all playable items for sequential playback
  const playableItems = useMemo(() => {
    const items: { type: "tts" | "episode"; msgIdx: number; episodeIdx?: number }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === "assistant" && (!msg.type || msg.type === "assistant") && msg.content.trim()) {
        items.push({ type: "tts", msgIdx: i });
      }
      if (msg.type === "episodes" && msg.episodes) {
        for (let j = 0; j < msg.episodes.length; j++) {
          items.push({ type: "episode", msgIdx: i, episodeIdx: j });
        }
      }
    }
    return items;
  }, [messages]);

  // Find the latest episodes message for auto-play
  const latestEpisodesIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "episodes" && messages[i].episodes?.length) return i;
    }
    return -1;
  }, [messages]);

  const handleSubmit = useCallback(() => {
    setProcessing(true);
  }, [setProcessing]);

  // Generate a unique key for an episode to use in the refs map
  const episodeKey = (msgIdx: number, epIdx: number) => `${msgIdx}-${epIdx}`;

  // Create onEnded handler for episodes that chains to the next playable item
  const getEpisodeOnEnded = useCallback((msgIdx: number, epIdx: number) => {
    return () => {
      // Find current item in playlist
      const key = episodeKey(msgIdx, epIdx);
      const currentPlaylistIdx = playableItems.findIndex(
        (item) => item.type === "episode" && item.msgIdx === msgIdx && item.episodeIdx === epIdx
      );
      if (currentPlaylistIdx < 0 || currentPlaylistIdx >= playableItems.length - 1) return;

      const next = playableItems[currentPlaylistIdx + 1];
      if (next.type === "episode" && next.episodeIdx !== undefined) {
        const nextKey = episodeKey(next.msgIdx, next.episodeIdx);
        episodeRefsMap.current.get(nextKey)?.play();
      }
      // TTS auto-chain is handled separately via MessageTTS onEnded
    };
  }, [playableItems]);

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
                  ? isTTSPlaying
                    ? "voice-glow-dark text-white"
                    : "bg-black text-white"
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
                  className="p-3 rounded-lg text-[15px] leading-relaxed font-medium text-black bg-black/[0.06]"
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
                  className="px-3 py-1.5 text-[13px] leading-relaxed text-black/35 italic"
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
                  className="px-3 py-1 text-[12px] font-mono text-black/30"
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
              const isLatest = i === latestEpisodesIdx;
              return (
                <div key={i} className="flex flex-col gap-4 w-full">
                  {msg.episodes.map((episode, j) => {
                    const key = episodeKey(i, j);
                    return (
                      <FullPodcastCard
                        key={j}
                        ref={(handle) => {
                          if (handle) episodeRefsMap.current.set(key, handle);
                          else episodeRefsMap.current.delete(key);
                        }}
                        podcast={episode}
                        autoPlay={isLatest && j === 0}
                        onEnded={getEpisodeOnEnded(i, j)}
                      />
                    );
                  })}
                </div>
              );
            }

            if (msg.type === "error") {
              return (
                <div
                  key={i}
                  className="p-3 rounded-lg text-[15px] leading-relaxed bg-red-50 text-red-600"
                >
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={i}
                className="w-full"
              >
                <div className="p-3 rounded-lg text-[15px] leading-relaxed bg-black/[0.04] text-black/70 prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                  <Markdown>{msg.content}</Markdown>
                </div>
                <MessageTTS
                  text={msg.content}
                  autoPlay={isVoiceMode && i === lastAssistantIdx}
                  messageIndex={i}
                />
              </div>
            );
          })}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="size-4 text-black/30 animate-spin" />
              <span className="text-sm text-black/30">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <QueryBlock onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
