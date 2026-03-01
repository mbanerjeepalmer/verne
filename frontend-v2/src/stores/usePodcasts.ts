import { IPodcast } from "@/types/podcast";
import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "reasoning" | "tool_call" | "tool_result" | "assistant" | "error" | "episodes";
  episodes?: IPodcast[];
}

interface PodcastsState {
  message: string | null;
  messages: ChatMessage[];
  isVoiceMode: boolean;
  isProcessing: boolean;
  setMessage: (message: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setVoiceMode: (isVoice: boolean) => void;
  setProcessing: (processing: boolean) => void;
}

export const usePodcasts = create<PodcastsState>((set) => ({
  message: null,
  messages: [],
  isVoiceMode: false,
  isProcessing: false,
  setMessage: (message) => set({ message }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setVoiceMode: (isVoice) => set({ isVoiceMode: isVoice }),
  setProcessing: (processing) => set({ isProcessing: processing }),
}));
