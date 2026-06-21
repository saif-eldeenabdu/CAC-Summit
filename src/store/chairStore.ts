import { create } from "zustand";
import { db } from "@/lib/firebase";
import { ref, onValue, set as fbSet, remove as fbRemove, get as fbGet } from "firebase/database";

// ─── Types ──────────────────────────────────────────────────────────
export interface Chair {
  id: string;
  name: string;
  createdAt: number;
}

interface ChairState {
  chairs: Chair[];
  activeChairId: string | null;
  _initialized: boolean;

  // Actions
  addChair: (name: string) => Chair;
  removeChair: (id: string) => void;
  renameChair: (id: string, name: string) => void;
  setActiveChair: (id: string) => void;
  logout: () => void;
}

// ─── Pre-seeded chairs ──────────────────────────────────────────────
const PRESEEDED_CHAIRS: Chair[] = [
  { id: "chair-saif", name: "Saif-Eldeen", createdAt: 1750000000000 },
  { id: "chair-judy", name: "Judy", createdAt: 1750000000000 },
];

// ─── Store ──────────────────────────────────────────────────────────
export const useChairStore = create<ChairState>()((set, get) => ({
  chairs: [],
  activeChairId: null,
  _initialized: false,

  addChair: (name) => {
    const chair: Chair = {
      id: `chair-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
    };
    // Optimistic update
    set({ chairs: [...get().chairs, chair] });
    // Write to Firebase
    fbSet(ref(db, `chairs/${chair.id}`), { name: chair.name, createdAt: chair.createdAt });
    return chair;
  },

  removeChair: (id) => {
    const state = get();
    set({
      chairs: state.chairs.filter((c) => c.id !== id),
      activeChairId: state.activeChairId === id ? null : state.activeChairId,
    });
    // Remove from Firebase
    fbRemove(ref(db, `chairs/${id}`));
    fbRemove(ref(db, `committee-data/${id}`));
  },

  renameChair: (id, name) => {
    set({
      chairs: get().chairs.map((c) => (c.id === id ? { ...c, name } : c)),
    });
    // Update Firebase
    fbSet(ref(db, `chairs/${id}/name`), name);
  },

  setActiveChair: (id) => {
    set({ activeChairId: id });
    // Persist active chair to localStorage only (device-specific)
    try {
      localStorage.setItem("mun-active-chair", id);
    } catch {
      // ignore
    }
  },

  logout: () => {
    set({ activeChairId: null });
    try {
      localStorage.removeItem("mun-active-chair");
    } catch {
      // ignore
    }
  },
}));

// ─── Firebase listener (init once) ──────────────────────────────────
let listenerAttached = false;

export function initChairSync() {
  if (listenerAttached) return;
  listenerAttached = true;

  const chairsRef = ref(db, "chairs");

  // Seed default chairs if database is empty
  fbGet(chairsRef).then((snapshot) => {
    if (!snapshot.exists()) {
      PRESEEDED_CHAIRS.forEach((chair) => {
        fbSet(ref(db, `chairs/${chair.id}`), {
          name: chair.name,
          createdAt: chair.createdAt,
        });
      });
    }
  });

  // Real-time listener
  onValue(chairsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      useChairStore.setState({ chairs: [], _initialized: true });
      return;
    }
    const chairs: Chair[] = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      name: val.name,
      createdAt: val.createdAt || 0,
    }));
    // Sort by createdAt for consistent ordering
    chairs.sort((a, b) => a.createdAt - b.createdAt);

    useChairStore.setState({ chairs, _initialized: true });
  });

  // Restore last active chair from localStorage
  try {
    const saved = localStorage.getItem("mun-active-chair");
    if (saved) {
      useChairStore.setState({ activeChairId: saved });
    }
  } catch {
    // ignore
  }
}

// ─── Selectors ──────────────────────────────────────────────────────
export function getActiveChair(): Chair | null {
  const state = useChairStore.getState();
  if (!state.activeChairId) return null;
  return state.chairs.find((c) => c.id === state.activeChairId) ?? null;
}
