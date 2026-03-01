import { create } from "zustand";

export interface PlayableItem {
  id: string;              // episode src or "tts-{index}"
  type: "episode" | "tts";
  audio: HTMLAudioElement;
  meta: { name: string; coverImage?: string; duration: number };
}

interface AudioPlayerState {
  activeItem: PlayableItem | null;
  /** Whether the active episode's card is visible in the scroll viewport */
  isCardVisible: boolean;
  onEndedCallback: (() => void) | null;

  play: (item: PlayableItem) => void;
  pause: () => void;
  setCardVisible: (itemId: string, visible: boolean) => void;
  setOnEnded: (cb: (() => void) | null) => void;
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  activeItem: null,
  isCardVisible: true,
  onEndedCallback: null,

  play: (item) => {
    const { activeItem } = get();

    // Pause any currently playing item
    if (activeItem && activeItem.id !== item.id) {
      activeItem.audio.pause();
    }

    set({ activeItem: item, isCardVisible: true });
  },

  pause: () => {
    const { activeItem } = get();
    if (activeItem) {
      activeItem.audio.pause();
    }
    set({ activeItem: null, isCardVisible: true, onEndedCallback: null });
  },

  setCardVisible: (itemId, visible) => {
    const { activeItem } = get();
    if (activeItem?.id === itemId) {
      set({ isCardVisible: visible });
    }
  },

  setOnEnded: (cb) => {
    set({ onEndedCallback: cb });
  },
}));
