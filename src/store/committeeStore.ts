import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
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

// ─── Undo stacks (per chair) ────────────────────────────────────────
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

// ─── Store cache (one store per chairId) ────────────────────────────
const storeCache: Record<string, UseBoundStore<StoreApi<CommitteeState>>> = {};

export function getChairCommitteeStore(chairId: string): UseBoundStore<StoreApi<CommitteeState>> {
  if (storeCache[chairId]) return storeCache[chairId];

  const store = create<CommitteeState>()(
    persist(
      (set, get) => ({
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deleteSpeech: (delegationName, speechId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.speeches = delegation.speeches.filter((s) => s.id !== speechId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deletePOI: (delegationName, poiId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.poisAsked = delegation.poisAsked.filter((p) => p.id !== poiId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deletePOIResponse: (delegationName, responseId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.poiResponses = delegation.poiResponses.filter((r) => r.id !== responseId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deleteDirective: (delegationName, directiveId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.directives = delegation.directives.filter((d) => d.id !== directiveId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        setChairNotes: (delegationName, notes) => {
          const state = get();
          const delegation = { ...state.delegations[delegationName] };
          delegation.chairNotes = notes;
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deleteNote: (delegationName, noteId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.notes = delegation.notes.filter((n) => n.id !== noteId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
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
          set({
            delegations: { ...state.delegations, [delegationName]: delegation },
            timeline,
          });
        },

        deleteLeadershipEvent: (delegationName, eventId) => {
          const state = get();
          pushUndo(chairId, state);
          const delegation = { ...state.delegations[delegationName] };
          delegation.leadershipEvents = delegation.leadershipEvents.filter((e) => e.id !== eventId);
          set({ delegations: { ...state.delegations, [delegationName]: delegation } });
        },

        // ── Awards ─────────────────────────────────────────────────
        setAwardOverride: (award, delegation) => {
          const state = get();
          set({ awardOverrides: { ...state.awardOverrides, [award]: delegation } });
        },

        clearAwardOverride: (award) => {
          const state = get();
          const overrides = { ...state.awardOverrides };
          delete overrides[award];
          set({ awardOverrides: overrides });
        },

        // ── Committee Info ─────────────────────────────────────────
        setCommitteeInfo: (name, topic) => {
          set({ committeeInfo: { name, topic } });
        },

        // ── Reset & Import ────────────────────────────────────────
        resetAll: () => {
          const stack = getUndoStack(chairId);
          stack.length = 0;
          set({
            delegations: createInitialDelegations(),
            timeline: [],
            awardOverrides: {},
          });
        },

        importState: (imported) => {
          set({
            ...(imported.delegations && { delegations: imported.delegations }),
            ...(imported.timeline && { timeline: imported.timeline }),
            ...(imported.awardOverrides && { awardOverrides: imported.awardOverrides }),
            ...(imported.committeeInfo && { committeeInfo: imported.committeeInfo }),
          });
        },
      }),
      {
        name: `mun-committee-store-${chairId}`,
      }
    )
  );

  storeCache[chairId] = store;
  return store;
}

// ─── Convenience hook: auto-selects active chair's store ────────────
// This creates a React hook that proxies to the active chair's store.
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
  store.setState({
    delegations: snapshot.delegations,
    timeline: snapshot.timeline,
    awardOverrides: snapshot.awardOverrides,
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

// ─── Migration: old single-store → first chair ─────────────────────
export function migrateOldStore() {
  try {
    const oldData = localStorage.getItem("mun-committee-store");
    if (!oldData) return;
    const chairStore = useChairStore.getState();
    if (chairStore.chairs.length > 0) return; // already migrated

    // Create first chair and migrate data
    const chair = chairStore.addChair("Chair 1");
    const parsed = JSON.parse(oldData);
    if (parsed?.state?.delegations) {
      const store = getChairCommitteeStore(chair.id);
      store.getState().importState(parsed.state);
    }
    // Remove old store
    localStorage.removeItem("mun-committee-store");
  } catch {
    // ignore migration errors
  }
}
