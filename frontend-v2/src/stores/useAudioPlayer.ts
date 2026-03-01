import { create } from "zustand";

interface EpisodeMeta {
  name: string;
  coverImage: string;
  duration: number;
}

interface AudioPlayerState {
  /** ID of the currently playing episode (src URL used as ID) */
  activeEpisodeId: string | null;
  /** Reference to the currently active HTMLAudioElement */
  activeAudio: HTMLAudioElement | null;
  /** Metadata for the active episode (for sticky player display) */
  activeMeta: EpisodeMeta | null;
  /** Whether the active episode's card is visible in the scroll viewport */
  isCardVisible: boolean;
  /**
   * Register an episode as now playing. Pauses any previously active episode.
   */
  play: (episodeId: string, audio: HTMLAudioElement, meta: EpisodeMeta) => void;
  /** Mark the active episode as paused (clears active state only if it matches) */
  pause: (episodeId: string) => void;
  /** Update card visibility for the active episode */
  setCardVisible: (episodeId: string, visible: boolean) => void;
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  activeEpisodeId: null,
  activeAudio: null,
  activeMeta: null,
  isCardVisible: true,

  play: (episodeId, audio, meta) => {
    const { activeAudio, activeEpisodeId } = get();

    // Pause the previously playing episode if it's different
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
