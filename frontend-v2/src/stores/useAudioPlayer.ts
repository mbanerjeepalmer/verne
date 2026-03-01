import { create } from "zustand";

interface AudioPlayerState {
  /** ID of the currently playing episode (src URL used as ID) */
  activeEpisodeId: string | null;
  /** Reference to the currently active HTMLAudioElement */
  activeAudio: HTMLAudioElement | null;
  /**
   * Register an episode as now playing. Pauses any previously active episode.
   * Returns true if this episode is now the active one.
   */
  play: (episodeId: string, audio: HTMLAudioElement) => void;
  /** Mark the active episode as paused (clears active state only if it matches) */
  pause: (episodeId: string) => void;
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  activeEpisodeId: null,
  activeAudio: null,

  play: (episodeId, audio) => {
    const { activeAudio, activeEpisodeId } = get();

    // Pause the previously playing episode if it's different
    if (activeAudio && activeEpisodeId !== episodeId) {
      activeAudio.pause();
    }

    set({ activeEpisodeId: episodeId, activeAudio: audio });
  },

  pause: (episodeId) => {
    const { activeEpisodeId } = get();
    if (activeEpisodeId === episodeId) {
      set({ activeEpisodeId: null, activeAudio: null });
    }
  },
}));
