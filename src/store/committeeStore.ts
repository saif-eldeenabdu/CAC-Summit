import { create, type StoreApi, type UseBoundStore } from "zustand";
import type {
  CommitteeState,
  Delegation,
  QualityRating,
  DirectiveStatus,
  AwardType,
  Speech,
  Directive,
  TimelineEntry,
  ActivityType,
} from "./types";
import { useChairStore } from "./chairStore";
import { DELEGATIONS } from "@/lib/delegations";
import { generateId } from "@/lib/utils";
import {
  calcSpeechWeightedScore,
  calcDirectiveQualityScore,
  POI_ASKED_POINTS,
  POI_RESPONSE_POINTS,
} from "./scoring";
import { db } from "@/lib/firebase";
import { ref, onValue, set as fbSet, off } from "firebase/database";

// ─── Helpers ────────────────────────────────────────────────────────
function createEmptyDelegation(name: string): Delegation {
  return {
    name,
    speeches: [],
    poisAsked: [],
    poiResponses: [],
    directives: [],
    leadershipEvents: [],
    notes: [],
    chairDiscretion: 0,
    chairNotes: "",
  };
}

function createInitialDelegations(): Record<string, Delegation> {
  const record: Record<string, Delegation> = {};
  DELEGATIONS.forEach((name) => {
    record[name] = createEmptyDelegation(name);
  });
  return record;
}

function addTimelineEntry(
  timeline: TimelineEntry[],
  delegation: string,
  activityType: ActivityType,
  scoreImpact: number,
  details: string,
  notes: string = "",
  chairId: string = ""
): TimelineEntry[] {
  const entry: TimelineEntry = {
    id: generateId(),
    timestamp: Date.now(),
    delegation,
    activityType,
    scoreImpact,
    details,
    notes,
    chairId,
  };
  return [entry, ...timeline];
}

// ─── Undo stacks (per chair, in-memory only) ────────────────────────
const MAX_UNDO = 50;
type Snapshot = {
  delegations: Record<string, Delegation>;
  timeline: TimelineEntry[];
  awardOverrides: Record<string, string>;
};
const undoStacks: Record<string, Snapshot[]> = {};

function getUndoStack(chairId: string): Snapshot[] {
  if (!undoStacks[chairId]) undoStacks[chairId] = [];
  return undoStacks[chairId];
}

function pushUndo(chairId: string, state: CommitteeState) {
  const stack = getUndoStack(chairId);
  stack.push({
    delegations: JSON.parse(JSON.stringify(state.delegations)),
    timeline: JSON.parse(JSON.stringify(state.timeline)),
    awardOverrides: { ...state.awardOverrides },
  });
  if (stack.length > MAX_UNDO) stack.shift();
}

// ─── Firebase sync helpers ──────────────────────────────────────────
let writeTimer: Record<string, ReturnType<typeof setTimeout>> = {};

function getFirebasePath(chairId: string) {
  return `committee-data/${chairId}`;
}

function writeToFirebase(chairId: string, state: CommitteeState) {
  // Debounce writes — 300ms
  if (writeTimer[chairId]) clearTimeout(writeTimer[chairId]);
  writeTimer[chairId] = setTimeout(() => {
    const data = {
      delegations: state.delegations,
      timeline: state.timeline,
      awardOverrides: state.awardOverrides,
      committeeInfo: state.committeeInfo,
    };
    fbSet(ref(db, getFirebasePath(chairId)), data);
  }, 300);
}

// Suppress Firebase listener echoes while we are writing
const suppressEcho: Record<string, boolean> = {};

function withSuppress(chairId: string, fn: () => void) {
  suppressEcho[chairId] = true;
  fn();
  // Clear suppression after debounce period + buffer
  setTimeout(() => {
    suppressEcho[chairId] = false;
  }, 500);
}

// ─── Store cache (one store per chairId) ────────────────────────────
const storeCache: Record<string, UseBoundStore<StoreApi<CommitteeState>>> = {};
const listeners: Record<string, boolean> = {};

export function getChairCommitteeStore(chairId: string): UseBoundStore<StoreApi<CommitteeState>> {
  if (storeCache[chairId]) return storeCache[chairId];

  const store = create<CommitteeState>()((set, get) => ({
    delegations: createInitialDelegations(),
    timeline: [],
    awardOverrides: {},
    committeeInfo: {
      name: "CAC Summit II",
      topic: "",
    },

    // ── Speeches ────────────────────────────────────────────────
    addSpeech: (delegationName, speechData) => {
      const state = get();
      pushUndo(chairId, state);
      const weightedScore = calcSpeechWeightedScore(speechData);
      const speech: Speech = {
        ...speechData,
        id: generateId(),
        timestamp: Date.now(),
        weightedScore,
      };
      const delegation = { ...state.delegations[delegationName] };
      delegation.speeches = [...delegation.speeches, speech];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "Speech",
        weightedScore,
        `${speechData.type} speech — Score: ${weightedScore.toFixed(1)}`,
        "",
        chairId
      );
      const newState = {
        ...get(),
        delegations: { ...state.delegations, [delegationName]: delegation },
        timeline,
      };
      withSuppress(chairId, () => {
        set({ delegations: newState.delegations, timeline: newState.timeline });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deleteSpeech: (delegationName, speechId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.speeches = delegation.speeches.filter((s) => s.id !== speechId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── POIs Asked ──────────────────────────────────────────────
    addPOI: (delegationName, quality, notes) => {
      const state = get();
      pushUndo(chairId, state);
      const points = POI_ASKED_POINTS[quality];
      const poi = {
        id: generateId(),
        timestamp: Date.now(),
        quality,
        points,
        notes,
      };
      const delegation = { ...state.delegations[delegationName] };
      delegation.poisAsked = [...delegation.poisAsked, poi];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "POI Asked",
        points,
        `Quality: ${quality} — +${points} pts`,
        notes,
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deletePOI: (delegationName, poiId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.poisAsked = delegation.poisAsked.filter((p) => p.id !== poiId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── POI Responses ───────────────────────────────────────────
    addPOIResponse: (delegationName, quality, notes) => {
      const state = get();
      pushUndo(chairId, state);
      const points = POI_RESPONSE_POINTS[quality];
      const response = {
        id: generateId(),
        timestamp: Date.now(),
        quality,
        points,
        notes,
      };
      const delegation = { ...state.delegations[delegationName] };
      delegation.poiResponses = [...delegation.poiResponses, response];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "POI Response",
        points,
        `Quality: ${quality} — +${points} pts`,
        notes,
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deletePOIResponse: (delegationName, responseId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.poiResponses = delegation.poiResponses.filter((r) => r.id !== responseId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Directives ─────────────────────────────────────────────
    addDirective: (delegationName, directiveData) => {
      const state = get();
      pushUndo(chairId, state);
      const qualityScore = calcDirectiveQualityScore(directiveData);
      const directive: Directive = {
        ...directiveData,
        id: generateId(),
        timestamp: Date.now(),
        qualityScore,
        passBonus: 0,
      };
      const delegation = { ...state.delegations[delegationName] };
      delegation.directives = [...delegation.directives, directive];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "Directive Submitted",
        qualityScore,
        `"${directiveData.title}" — Quality: ${qualityScore.toFixed(1)}`,
        directiveData.notes,
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deleteDirective: (delegationName, directiveId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.directives = delegation.directives.filter((d) => d.id !== directiveId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    updateDirectiveStatus: (delegationName, directiveId, status) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.directives = delegation.directives.map((d) => {
        if (d.id !== directiveId) return d;
        const passBonus = status === "Passed" ? 10 : 0;
        return { ...d, status, passBonus };
      });
      const directive = delegation.directives.find((d) => d.id === directiveId);
      const activityType: ActivityType = status === "Passed" ? "Directive Passed" : "Directive Failed";
      const bonus = status === "Passed" ? 10 : 0;
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        activityType,
        bonus,
        `"${directive?.title}" — ${status}${bonus ? ` (+${bonus} bonus)` : ""}`,
        "",
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Chair Discretion ────────────────────────────────────────
    setChairDiscretion: (delegationName, value) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      const oldValue = delegation.chairDiscretion;
      delegation.chairDiscretion = value;
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "Chair Discretion",
        value - oldValue,
        `Chair discretion: ${oldValue} → ${value}`,
        "",
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    setChairNotes: (delegationName, notes) => {
      const state = get();
      const delegation = { ...state.delegations[delegationName] };
      delegation.chairNotes = notes;
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Notes ──────────────────────────────────────────────────
    addNote: (delegationName, content) => {
      const state = get();
      pushUndo(chairId, state);
      const note = { id: generateId(), timestamp: Date.now(), content };
      const delegation = { ...state.delegations[delegationName] };
      delegation.notes = [...delegation.notes, note];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "Chair Note",
        0,
        content.slice(0, 80),
        "",
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deleteNote: (delegationName, noteId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.notes = delegation.notes.filter((n) => n.id !== noteId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Leadership Events ─────────────────────────────────────
    addLeadershipEvent: (delegationName, description, points) => {
      const state = get();
      pushUndo(chairId, state);
      const event = { id: generateId(), timestamp: Date.now(), description, points };
      const delegation = { ...state.delegations[delegationName] };
      delegation.leadershipEvents = [...delegation.leadershipEvents, event];
      const timeline = addTimelineEntry(
        state.timeline,
        delegationName,
        "Leadership Event",
        points,
        `${description} — +${points} pts`,
        "",
        chairId
      );
      withSuppress(chairId, () => {
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
        writeToFirebase(chairId, { ...get() });
      });
    },

    deleteLeadershipEvent: (delegationName, eventId) => {
      const state = get();
      pushUndo(chairId, state);
      const delegation = { ...state.delegations[delegationName] };
      delegation.leadershipEvents = delegation.leadershipEvents.filter((e) => e.id !== eventId);
      withSuppress(chairId, () => {
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Awards ─────────────────────────────────────────────────
    setAwardOverride: (award, delegation) => {
      withSuppress(chairId, () => {
        const state = get();
        set({ awardOverrides: { ...state.awardOverrides, [award]: delegation } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    clearAwardOverride: (award) => {
      withSuppress(chairId, () => {
        const state = get();
        const overrides = { ...state.awardOverrides };
        delete overrides[award];
        set({ awardOverrides: overrides });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Committee Info ─────────────────────────────────────────
    setCommitteeInfo: (name, topic) => {
      withSuppress(chairId, () => {
        set({ committeeInfo: { name, topic } });
        writeToFirebase(chairId, { ...get() });
      });
    },

    // ── Reset & Import ────────────────────────────────────────
    resetAll: () => {
      const stack = getUndoStack(chairId);
      stack.length = 0;
      const freshState = {
        delegations: createInitialDelegations(),
        timeline: [] as TimelineEntry[],
        awardOverrides: {} as Record<string, string>,
      };
      withSuppress(chairId, () => {
        set(freshState);
        writeToFirebase(chairId, { ...get() });
      });
    },

    importState: (imported) => {
      withSuppress(chairId, () => {
        set({
          ...(imported.delegations && { delegations: imported.delegations }),
          ...(imported.timeline && { timeline: imported.timeline }),
          ...(imported.awardOverrides && { awardOverrides: imported.awardOverrides }),
          ...(imported.committeeInfo && { committeeInfo: imported.committeeInfo }),
        });
        writeToFirebase(chairId, { ...get() });
      });
    },
  }));

  storeCache[chairId] = store;

  // Subscribe to Firebase for real-time sync
  if (!listeners[chairId]) {
    listeners[chairId] = true;
    const dataRef = ref(db, getFirebasePath(chairId));
    onValue(dataRef, (snapshot) => {
      // Don't overwrite local state with our own echo
      if (suppressEcho[chairId]) return;

      const data = snapshot.val();
      if (!data) return; // No data yet in Firebase

      // Merge Firebase data into store — only overwrite data fields, not actions
      const update: Partial<CommitteeState> = {};

      if (data.delegations) {
        // Ensure all expected delegations exist (Firebase strips empty arrays)
        const merged: Record<string, Delegation> = {};
        DELEGATIONS.forEach((name) => {
          const fbDel = data.delegations[name];
          if (fbDel) {
            merged[name] = {
              name: fbDel.name || name,
              speeches: fbDel.speeches || [],
              poisAsked: fbDel.poisAsked || [],
              poiResponses: fbDel.poiResponses || [],
              directives: fbDel.directives || [],
              leadershipEvents: fbDel.leadershipEvents || [],
              notes: fbDel.notes || [],
              chairDiscretion: fbDel.chairDiscretion || 0,
              chairNotes: fbDel.chairNotes || "",
            };
          } else {
            merged[name] = createEmptyDelegation(name);
          }
        });
        update.delegations = merged;
      }

      if (data.timeline) {
        // Firebase stores arrays as objects with numeric keys when sparse
        update.timeline = Array.isArray(data.timeline)
          ? data.timeline
          : Object.values(data.timeline);
      }

      if (data.awardOverrides) {
        update.awardOverrides = data.awardOverrides;
      }

      if (data.committeeInfo) {
        update.committeeInfo = data.committeeInfo;
      }

      if (Object.keys(update).length > 0) {
        store.setState(update);
      }
    });
  }

  return store;
}

// ─── Convenience hook: auto-selects active chair's store ────────────
// Components just call useCommitteeStore(selector) as before.
export function useCommitteeStore<T>(selector: (state: CommitteeState) => T): T {
  const activeChairId = useChairStore((s) => s.activeChairId);
  const chairId = activeChairId || "__default__";
  const store = getChairCommitteeStore(chairId);
  return store(selector);
}

// ─── Undo function (exported separately) ────────────────────────────
export function undo() {
  const chairId = useChairStore.getState().activeChairId || "__default__";
  const stack = getUndoStack(chairId);
  const snapshot = stack.pop();
  if (!snapshot) return false;
  const store = getChairCommitteeStore(chairId);
  withSuppress(chairId, () => {
    store.setState({
      delegations: snapshot.delegations,
      timeline: snapshot.timeline,
      awardOverrides: snapshot.awardOverrides,
    });
    writeToFirebase(chairId, { ...store.getState() });
  });
  return true;
}

// ─── Backup / Restore ───────────────────────────────────────────────
export function exportBackup(): string {
  const chairId = useChairStore.getState().activeChairId || "__default__";
  const store = getChairCommitteeStore(chairId);
  const state = store.getState();
  return JSON.stringify({
    delegations: state.delegations,
    timeline: state.timeline,
    awardOverrides: state.awardOverrides,
    committeeInfo: state.committeeInfo,
    chairId,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function downloadBackup() {
  const json = exportBackup();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mun-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.delegations) {
          const chairId = useChairStore.getState().activeChairId || "__default__";
          const store = getChairCommitteeStore(chairId);
          store.getState().importState(data);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}
