import { IPodcast } from "@/types/podcast";
import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "reasoning" | "tool_call" | "tool_result" | "assistant" | "error" | "episodes";
  podcasts?: IPodcast[];
}

interface PodcastsState {
  message: string | null;
  messages: ChatMessage[];
  setMessage: (message: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const usePodcasts = create<PodcastsState>((set) => ({
  message: null,
  messages: [],
  setMessage: (message) => set({ message }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
