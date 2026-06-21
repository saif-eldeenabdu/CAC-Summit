import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────
export interface Chair {
  id: string;
  name: string;
  createdAt: number;
}

interface ChairState {
  chairs: Chair[];
  activeChairId: string | null;

  // Actions
  addChair: (name: string) => Chair;
  removeChair: (id: string) => void;
  renameChair: (id: string, name: string) => void;
  setActiveChair: (id: string) => void;
  logout: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────
export const useChairStore = create<ChairState>()(
  persist(
    (set, get) => ({
      chairs: [],
      activeChairId: null,

      addChair: (name) => {
        const chair: Chair = {
          id: generateId(),
          name,
          createdAt: Date.now(),
        };
        set({ chairs: [...get().chairs, chair] });
        return chair;
      },

      removeChair: (id) => {
        const state = get();
        set({
          chairs: state.chairs.filter((c) => c.id !== id),
          activeChairId: state.activeChairId === id ? null : state.activeChairId,
        });
        // Clean up that chair's committee store from localStorage
        try {
          localStorage.removeItem(`mun-committee-store-${id}`);
        } catch {
          // ignore
        }
      },

      renameChair: (id, name) => {
        set({
          chairs: get().chairs.map((c) => (c.id === id ? { ...c, name } : c)),
        });
      },

      setActiveChair: (id) => {
        set({ activeChairId: id });
      },

      logout: () => {
        set({ activeChairId: null });
      },
    }),
    {
      name: "mun-chair-store",
    }
  )
);

// ─── Selectors ──────────────────────────────────────────────────────
export function getActiveChair(): Chair | null {
  const state = useChairStore.getState();
  if (!state.activeChairId) return null;
  return state.chairs.find((c) => c.id === state.activeChairId) ?? null;
}
