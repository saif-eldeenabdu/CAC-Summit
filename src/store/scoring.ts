import type {
  Speech,
  Delegation,
  DelegationScores,
  QualityRating,
  Directive,
} from "./types";

// ─── POI point mappings ──────────────────────────────────────────────
export const POI_ASKED_POINTS: Record<QualityRating, number> = {
  Poor: 1,
  Average: 2,
  Good: 3,
  Excellent: 5,
};

export const POI_RESPONSE_POINTS: Record<QualityRating, number> = {
  Poor: 1,
  Average: 2,
  Good: 4,
  Excellent: 6,
};

// ─── Speech scoring ─────────────────────────────────────────────────
export function calcSpeechWeightedScore(s: Omit<Speech, "id" | "timestamp" | "weightedScore">): number {
  const raw =
    s.informationResearch * 0.4 +
    s.delivery * 0.25 +
    s.creativity * 0.2 +
    s.passion * 0.15;
  return Math.round(raw * 100) / 100;
}

// ─── Directive scoring ──────────────────────────────────────────────
export function calcDirectiveQualityScore(d: Pick<Directive, "researchQuality" | "practicality" | "creativity" | "diplomaticValue">): number {
  const raw = (d.researchQuality + d.practicality + d.creativity + d.diplomaticValue) / 4;
  return Math.round(raw * 100) / 100;
}

// ─── Category scores (raw sums) ────────────────────────────────────
export function calcSpeechTotal(delegation: Delegation): number {
  if (delegation.speeches.length === 0) return 0;
  const total = delegation.speeches.reduce((sum, s) => sum + s.weightedScore, 0);
  return Math.round(total * 100) / 100;
}

export function calcPOIAskedTotal(delegation: Delegation): number {
  return delegation.poisAsked.reduce((sum, p) => sum + p.points, 0);
}

export function calcPOIResponseTotal(delegation: Delegation): number {
  return delegation.poiResponses.reduce((sum, r) => sum + r.points, 0);
}

export function calcDirectiveTotal(delegation: Delegation): number {
  return delegation.directives.reduce((sum, d) => sum + d.qualityScore + d.passBonus, 0);
}

export function calcLeadershipTotal(delegation: Delegation): number {
  return delegation.leadershipEvents.reduce((sum, e) => sum + e.points, 0);
}

// ─── Final weighted score ───────────────────────────────────────────
// Weights: Speeches 40%, POIs Asked 10%, POI Responses 15%, Directives 25%, Chair Discretion 10%
// We compute each category as raw points, then apply weighting.
// The weighting is on the raw scores directly (not normalized to 100).
export function calcTotalScore(delegation: Delegation): number {
  const speechPts = calcSpeechTotal(delegation);
  const poiPts = calcPOIAskedTotal(delegation);
  const responsePts = calcPOIResponseTotal(delegation);
  const directivePts = calcDirectiveTotal(delegation);
  const discretion = delegation.chairDiscretion;
  const leadership = calcLeadershipTotal(delegation);

  // Raw weighted sum
  const total =
    speechPts * 0.4 +
    poiPts * 0.1 +
    responsePts * 0.15 +
    directivePts * 0.25 +
    discretion * 0.1 +
    leadership * 0.05;

  return Math.round(total * 100) / 100;
}

// ─── Category scores for display ────────────────────────────────────
export function calcCategoryScores(delegation: Delegation) {
  return {
    speeches: calcSpeechTotal(delegation),
    poisAsked: calcPOIAskedTotal(delegation),
    poiResponses: calcPOIResponseTotal(delegation),
    directives: calcDirectiveTotal(delegation),
    chairDiscretion: delegation.chairDiscretion,
    leadership: calcLeadershipTotal(delegation),
  };
}

// ─── Rankings ───────────────────────────────────────────────────────
export function calcRankings(delegations: Record<string, Delegation>): DelegationScores[] {
  const scores: DelegationScores[] = Object.values(delegations).map((d) => ({
    name: d.name,
    speechScore: calcSpeechTotal(d),
    poiAskedScore: calcPOIAskedTotal(d),
    poiResponseScore: calcPOIResponseTotal(d),
    directiveScore: calcDirectiveTotal(d),
    chairDiscretion: d.chairDiscretion,
    leadershipScore: calcLeadershipTotal(d),
    totalScore: calcTotalScore(d),
    rank: 0,
  }));

  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((s, i) => (s.rank = i + 1));

  return scores;
}

// ─── Averages ───────────────────────────────────────────────────────
export function calcAverageSpeechScore(delegation: Delegation): number {
  if (delegation.speeches.length === 0) return 0;
  const avg = delegation.speeches.reduce((s, sp) => s + sp.weightedScore, 0) / delegation.speeches.length;
  return Math.round(avg * 100) / 100;
}

export function calcAveragePOIQuality(delegation: Delegation): number {
  if (delegation.poisAsked.length === 0) return 0;
  const avg = delegation.poisAsked.reduce((s, p) => s + p.points, 0) / delegation.poisAsked.length;
  return Math.round(avg * 100) / 100;
}

export function calcAverageResponseQuality(delegation: Delegation): number {
  if (delegation.poiResponses.length === 0) return 0;
  const avg = delegation.poiResponses.reduce((s, r) => s + r.points, 0) / delegation.poiResponses.length;
  return Math.round(avg * 100) / 100;
}

export function calcAverageDirectiveQuality(delegation: Delegation): number {
  if (delegation.directives.length === 0) return 0;
  const avg = delegation.directives.reduce((s, d) => s + d.qualityScore, 0) / delegation.directives.length;
  return Math.round(avg * 100) / 100;
}

export function calcDirectivePassRate(delegation: Delegation): number {
  const total = delegation.directives.length;
  if (total === 0) return 0;
  const passed = delegation.directives.filter((d) => d.status === "Passed").length;
  return Math.round((passed / total) * 100);
}

// ─── Award recommendations ──────────────────────────────────────────
export function getAwardRecommendation(rank: number): string | null {
  if (rank === 1) return "Best Delegate";
  if (rank === 2) return "Outstanding Delegate";
  if (rank === 3) return "Honorable Mention";
  return null;
}
