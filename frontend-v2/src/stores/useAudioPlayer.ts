import { create } from "zustand";

interface EpisodeMeta {
  name: string;
  coverImage: string;
  duration: number;
}

interface AudioPlayerState {
  activeEpisodeId: string | null;
  activeAudio: HTMLAudioElement | null;
  activeMeta: EpisodeMeta | null;
  /** Whether the active episode's card is visible in the scroll viewport */
  isCardVisible: boolean;
  play: (episodeId: string, audio: HTMLAudioElement, meta: EpisodeMeta) => void;
  pause: (episodeId: string) => void;
  setCardVisible: (episodeId: string, visible: boolean) => void;
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  activeEpisodeId: null,
  activeAudio: null,
  activeMeta: null,
  isCardVisible: true,

  play: (episodeId, audio, meta) => {
    const { activeAudio, activeEpisodeId } = get();

    if (activeAudio && activeEpisodeId !== episodeId) {
      activeAudio.pause();
    }

    set({ activeEpisodeId: episodeId, activeAudio: audio, activeMeta: meta });
  },

  pause: (episodeId) => {
    const { activeEpisodeId } = get();
    if (activeEpisodeId === episodeId) {
      set({ activeEpisodeId: null, activeAudio: null, activeMeta: null, isCardVisible: true });
    }
  },

  setCardVisible: (episodeId, visible) => {
    const { activeEpisodeId } = get();
    if (activeEpisodeId === episodeId) {
      set({ isCardVisible: visible });
    }
  },
}));
