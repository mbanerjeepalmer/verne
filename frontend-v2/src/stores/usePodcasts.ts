import { IPodcast } from "@/types/podcast";
import { create } from "zustand";

interface PodcastsState {
  podcasts: IPodcast[];
  setPodcasts: (podcasts: IPodcast[]) => void;
  addPodcast: (podcast: IPodcast) => void;
  removePodcast: (src: string) => void;
  clearPodcasts: () => void;
}

export const usePodcasts = create<PodcastsState>((set) => ({
  podcasts: [],
  setPodcasts: (podcasts) => set({ podcasts }),
  addPodcast: (podcast) =>
    set((state) => ({ podcasts: [...state.podcasts, podcast] })),
  removePodcast: (src) =>
    set((state) => ({
      podcasts: state.podcasts.filter((p) => p.src !== src),
    })),
  clearPodcasts: () => set({ podcasts: [] }),
}));
