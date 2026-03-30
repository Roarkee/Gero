import { create } from "zustand";

export const useAppStore = create((set) => ({
    activeTimer: null,
    isTimerRunning: false,

    setActiveTimer: (timerData) => set({
        activeTimer: timerData,
        isTimerRunning: !!timerData
    }),

    clearActiveTimer: () => set({
        activeTimer: null,
        isTimerRunning: false
    }),

    // Any other global app state like caches can be added here
}));
