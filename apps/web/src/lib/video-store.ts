import { create } from 'zustand';

type VideoState = {
  isGlobalMuted: boolean;
  setGlobalMuted: (muted: boolean) => void;
  currentlyPlaying: string | null;
  setCurrentlyPlaying: (id: string | null) => void;
};

export const useVideoStore = create<VideoState>((set) => ({
  isGlobalMuted: true, // Default to muted to comply with browser autoplay policies
  setGlobalMuted: (muted) => set({ isGlobalMuted: muted }),
  currentlyPlaying: null,
  setCurrentlyPlaying: (id) => set({ currentlyPlaying: id }),
}));
