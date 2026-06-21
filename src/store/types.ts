// ─── Speech ──────────────────────────────────────────────────────────
export type SpeechType = "GSL" | "Moderated" | "Special" | "Crisis";

export interface Speech {
  id: string;
  timestamp: number;
  type: SpeechType;
  informationResearch: number; // 1-10
  delivery: number;           // 1-10
  creativity: number;         // 1-10
  passion: number;            // 1-10
  weightedScore: number;      // calculated
  notes: string;
}

// ─── POI ─────────────────────────────────────────────────────────────
export type QualityRating = "Poor" | "Average" | "Good" | "Excellent";

export interface POI {
  id: string;
  timestamp: number;
  quality: QualityRating;
  points: number;
  notes: string;
}

export interface POIResponse {
  id: string;
  timestamp: number;
  quality: QualityRating;
  points: number;
  notes: string;
}

// ─── Directive ───────────────────────────────────────────────────────
export type SubmissionType = "Individual" | "Co-Author" | "Sponsor";
export type DirectiveStatus = "Pending" | "Passed" | "Failed";

export interface Directive {
  id: string;
  timestamp: number;
  title: string;
  topic: string;
  submissionType: SubmissionType;
  researchQuality: number;    // 1-10
  practicality: number;       // 1-10
  creativity: number;         // 1-10
  diplomaticValue: number;    // 1-10
  qualityScore: number;       // calculated
  status: DirectiveStatus;
  passBonus: number;          // 10 if passed, 0 otherwise
  notes: string;
}

// ─── Leadership ──────────────────────────────────────────────────────
export interface LeadershipEvent {
  id: string;
  timestamp: number;
  description: string;
  points: number;
}

// ─── Note ────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  timestamp: number;
  content: string;
}

// ─── Delegation ──────────────────────────────────────────────────────
export interface Delegation {
  name: string;
  speeches: Speech[];
  poisAsked: POI[];
  poiResponses: POIResponse[];
  directives: Directive[];
  leadershipEvents: LeadershipEvent[];
  notes: Note[];
  chairDiscretion: number; // 0-20
  chairNotes: string;
}

// ─── Timeline ────────────────────────────────────────────────────────
export type ActivityType =
  | "Speech"
  | "POI Asked"
  | "POI Response"
  | "Directive Submitted"
  | "Directive Passed"
  | "Directive Failed"
  | "Chair Note"
  | "Chair Discretion"
  | "Leadership Event";

export interface TimelineEntry {
  id: string;
  timestamp: number;
  delegation: string;
  activityType: ActivityType;
  scoreImpact: number;
  details: string;
  notes: string;
  chairId: string;
}

// ─── Scores ──────────────────────────────────────────────────────────
export interface DelegationScores {
  name: string;
  speechScore: number;
  poiAskedScore: number;
  poiResponseScore: number;
  directiveScore: number;
  chairDiscretion: number;
  leadershipScore: number;
  totalScore: number;
  rank: number;
}

// ─── Awards ──────────────────────────────────────────────────────────
export type AwardType = "Best Delegate" | "Outstanding Delegate" | "Honorable Mention";

export interface AwardAssignment {
  award: AwardType;
  delegation: string;
  isOverride: boolean;
}

export interface CommitteeState {
  _isHydrated: boolean;
  delegations: Record<string, Delegation>;
  timeline: TimelineEntry[];
  awardOverrides: Record<string, string>; // award → delegation name
  committeeInfo: {
    name: string;
    topic: string;
  };

  // Actions
  addSpeech: (delegation: string, speech: Omit<Speech, "id" | "timestamp" | "weightedScore">) => void;
  deleteSpeech: (delegation: string, speechId: string) => void;
  addPOI: (delegation: string, quality: QualityRating, notes: string) => void;
  deletePOI: (delegation: string, poiId: string) => void;
  addPOIResponse: (delegation: string, quality: QualityRating, notes: string) => void;
  deletePOIResponse: (delegation: string, responseId: string) => void;
  addDirective: (delegation: string, directive: Omit<Directive, "id" | "timestamp" | "qualityScore" | "passBonus">) => void;
  deleteDirective: (delegation: string, directiveId: string) => void;
  updateDirectiveStatus: (delegation: string, directiveId: string, status: DirectiveStatus) => void;
  setChairDiscretion: (delegation: string, value: number) => void;
  setChairNotes: (delegation: string, notes: string) => void;
  addNote: (delegation: string, content: string) => void;
  deleteNote: (delegation: string, noteId: string) => void;
  addLeadershipEvent: (delegation: string, description: string, points: number) => void;
  deleteLeadershipEvent: (delegation: string, eventId: string) => void;
  setAwardOverride: (award: AwardType, delegation: string) => void;
  clearAwardOverride: (award: AwardType) => void;
  setCommitteeInfo: (name: string, topic: string) => void;
  resetAll: () => void;
  importState: (state: Partial<Pick<CommitteeState, "delegations" | "timeline" | "awardOverrides" | "committeeInfo">>) => void;
}
