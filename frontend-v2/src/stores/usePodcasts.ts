import { IPodcast } from "@/types/podcast";
import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "reasoning" | "tool_call" | "tool_result" | "assistant" | "error";
}

interface PodcastsState {
  podcasts: IPodcast[];
  message: string | null;
  messages: ChatMessage[];
  setPodcasts: (podcasts: IPodcast[]) => void;
  addPodcast: (podcast: IPodcast) => void;
  removePodcast: (src: string) => void;
  clearPodcasts: () => void;
  setMessage: (message: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const usePodcasts = create<PodcastsState>((set) => ({
  podcasts: [],
  message: null,
  messages: [],
  setPodcasts: (podcasts) => set({ podcasts }),
  addPodcast: (podcast) =>
    set((state) => ({ podcasts: [...state.podcasts, podcast] })),
  removePodcast: (src) =>
    set((state) => ({
      podcasts: state.podcasts.filter((p) => p.src !== src),
    })),
  clearPodcasts: () => set({ podcasts: [] }),
  setMessage: (message) => set({ message }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
