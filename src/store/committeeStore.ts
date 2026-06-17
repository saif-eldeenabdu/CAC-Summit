import { create } from "zustand";
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
  notes: string = ""
): TimelineEntry[] {
  const entry: TimelineEntry = {
    id: generateId(),
    timestamp: Date.now(),
    delegation,
    activityType,
    scoreImpact,
    details,
    notes,
  };
  return [entry, ...timeline];
}

// ─── Undo stack ─────────────────────────────────────────────────────
const MAX_UNDO = 50;
type Snapshot = {
  delegations: Record<string, Delegation>;
  timeline: TimelineEntry[];
  awardOverrides: Record<string, string>;
};
const undoStack: Snapshot[] = [];

function pushUndo(state: CommitteeState) {
  undoStack.push({
    delegations: JSON.parse(JSON.stringify(state.delegations)),
    timeline: JSON.parse(JSON.stringify(state.timeline)),
    awardOverrides: { ...state.awardOverrides },
  });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

// ─── Store ──────────────────────────────────────────────────────────
export const useCommitteeStore = create<CommitteeState>()(
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
        pushUndo(state);
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
          `${speechData.type} speech — Score: ${weightedScore.toFixed(1)}`
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deleteSpeech: (delegationName, speechId) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        delegation.speeches = delegation.speeches.filter((s) => s.id !== speechId);
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
      },

      // ── POIs Asked ──────────────────────────────────────────────
      addPOI: (delegationName, quality, notes) => {
        const state = get();
        pushUndo(state);
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
          notes
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deletePOI: (delegationName, poiId) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        delegation.poisAsked = delegation.poisAsked.filter((p) => p.id !== poiId);
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
      },

      // ── POI Responses ───────────────────────────────────────────
      addPOIResponse: (delegationName, quality, notes) => {
        const state = get();
        pushUndo(state);
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
          notes
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deletePOIResponse: (delegationName, responseId) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        delegation.poiResponses = delegation.poiResponses.filter((r) => r.id !== responseId);
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
      },

      // ── Directives ─────────────────────────────────────────────
      addDirective: (delegationName, directiveData) => {
        const state = get();
        pushUndo(state);
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
          directiveData.notes
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deleteDirective: (delegationName, directiveId) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        delegation.directives = delegation.directives.filter((d) => d.id !== directiveId);
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
      },

      updateDirectiveStatus: (delegationName, directiveId, status) => {
        const state = get();
        pushUndo(state);
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
          `"${directive?.title}" — ${status}${bonus ? ` (+${bonus} bonus)` : ""}`
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      // ── Chair Discretion ────────────────────────────────────────
      setChairDiscretion: (delegationName, value) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        const oldValue = delegation.chairDiscretion;
        delegation.chairDiscretion = value;
        const timeline = addTimelineEntry(
          state.timeline,
          delegationName,
          "Chair Discretion",
          value - oldValue,
          `Chair discretion: ${oldValue} → ${value}`
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
        pushUndo(state);
        const note = { id: generateId(), timestamp: Date.now(), content };
        const delegation = { ...state.delegations[delegationName] };
        delegation.notes = [...delegation.notes, note];
        const timeline = addTimelineEntry(
          state.timeline,
          delegationName,
          "Chair Note",
          0,
          content.slice(0, 80)
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deleteNote: (delegationName, noteId) => {
        const state = get();
        pushUndo(state);
        const delegation = { ...state.delegations[delegationName] };
        delegation.notes = delegation.notes.filter((n) => n.id !== noteId);
        set({ delegations: { ...state.delegations, [delegationName]: delegation } });
      },

      // ── Leadership Events ─────────────────────────────────────
      addLeadershipEvent: (delegationName, description, points) => {
        const state = get();
        pushUndo(state);
        const event = { id: generateId(), timestamp: Date.now(), description, points };
        const delegation = { ...state.delegations[delegationName] };
        delegation.leadershipEvents = [...delegation.leadershipEvents, event];
        const timeline = addTimelineEntry(
          state.timeline,
          delegationName,
          "Leadership Event",
          points,
          `${description} — +${points} pts`
        );
        set({
          delegations: { ...state.delegations, [delegationName]: delegation },
          timeline,
        });
      },

      deleteLeadershipEvent: (delegationName, eventId) => {
        const state = get();
        pushUndo(state);
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
        undoStack.length = 0;
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
      name: "mun-committee-store",
    }
  )
);

// ─── Undo function (exported separately) ────────────────────────────
export function undo() {
  const snapshot = undoStack.pop();
  if (!snapshot) return false;
  useCommitteeStore.setState({
    delegations: snapshot.delegations,
    timeline: snapshot.timeline,
    awardOverrides: snapshot.awardOverrides,
  });
  return true;
}

// ─── Backup / Restore ───────────────────────────────────────────────
export function exportBackup(): string {
  const state = useCommitteeStore.getState();
  return JSON.stringify({
    delegations: state.delegations,
    timeline: state.timeline,
    awardOverrides: state.awardOverrides,
    committeeInfo: state.committeeInfo,
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
          useCommitteeStore.getState().importState(data);
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
