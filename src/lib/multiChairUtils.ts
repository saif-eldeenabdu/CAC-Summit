import { useChairStore, type Chair } from "@/store/chairStore";
import { getChairCommitteeStore } from "@/store/committeeStore";
import {
  calcRankings,
  calcSpeechTotal,
  calcPOIAskedTotal,
  calcPOIResponseTotal,
  calcDirectiveTotal,
  calcLeadershipTotal,
  calcTotalScore,
} from "@/store/scoring";
import type { Delegation, DelegationScores } from "@/store/types";
import { DELEGATIONS } from "./delegations";

// ─── Types ──────────────────────────────────────────────────────────
export interface ChairDelegationData {
  chairId: string;
  chairName: string;
  delegations: Record<string, Delegation>;
  rankings: DelegationScores[];
}

export interface CombinedDelegationScore {
  name: string;
  averageTotal: number;
  averageSpeech: number;
  averagePOI: number;
  averageResponse: number;
  averageDirective: number;
  averageDiscretion: number;
  averageLeadership: number;
  rank: number;
  chairScores: { chairId: string; chairName: string; totalScore: number }[];
}

export type CategoryFilter = "total" | "speeches" | "pois" | "responses" | "directives";

// ─── Get all chairs' data ───────────────────────────────────────────
export function getAllChairData(): ChairDelegationData[] {
  const chairs = useChairStore.getState().chairs;
  return chairs.map((chair) => {
    const store = getChairCommitteeStore(chair.id);
    const state = store.getState();
    return {
      chairId: chair.id,
      chairName: chair.name,
      delegations: state.delegations,
      rankings: calcRankings(state.delegations),
    };
  });
}

// ─── Combined Rankings (averaged across chairs) ─────────────────────
export function calcCombinedRankings(): CombinedDelegationScore[] {
  const allData = getAllChairData();
  if (allData.length === 0) return [];

  const combined: CombinedDelegationScore[] = DELEGATIONS.map((name) => {
    const chairScores: { chairId: string; chairName: string; totalScore: number }[] = [];
    let totalSpeech = 0;
    let totalPOI = 0;
    let totalResponse = 0;
    let totalDirective = 0;
    let totalDiscretion = 0;
    let totalLeadership = 0;
    let totalScore = 0;

    allData.forEach((cd) => {
      const d = cd.delegations[name];
      if (!d) return;
      const speech = calcSpeechTotal(d);
      const poi = calcPOIAskedTotal(d);
      const response = calcPOIResponseTotal(d);
      const directive = calcDirectiveTotal(d);
      const leadership = calcLeadershipTotal(d);
      const total = calcTotalScore(d);

      totalSpeech += speech;
      totalPOI += poi;
      totalResponse += response;
      totalDirective += directive;
      totalDiscretion += d.chairDiscretion;
      totalLeadership += leadership;
      totalScore += total;

      chairScores.push({
        chairId: cd.chairId,
        chairName: cd.chairName,
        totalScore: total,
      });
    });

    const count = allData.length;
    return {
      name,
      averageTotal: Math.round((totalScore / count) * 100) / 100,
      averageSpeech: Math.round((totalSpeech / count) * 100) / 100,
      averagePOI: Math.round((totalPOI / count) * 100) / 100,
      averageResponse: Math.round((totalResponse / count) * 100) / 100,
      averageDirective: Math.round((totalDirective / count) * 100) / 100,
      averageDiscretion: Math.round((totalDiscretion / count) * 100) / 100,
      averageLeadership: Math.round((totalLeadership / count) * 100) / 100,
      rank: 0,
      chairScores,
    };
  });

  combined.sort((a, b) => b.averageTotal - a.averageTotal);
  combined.forEach((s, i) => (s.rank = i + 1));

  return combined;
}

// ─── Chair comparison data (for side-by-side) ───────────────────────
export interface ChairComparisonRow {
  delegation: string;
  chairs: {
    chairId: string;
    chairName: string;
    totalScore: number;
    speechScore: number;
    poiScore: number;
    responseScore: number;
    directiveScore: number;
    rank: number;
  }[];
  averageTotal: number;
  maxDifference: number;
}

export function calcChairComparison(category: CategoryFilter = "total"): ChairComparisonRow[] {
  const allData = getAllChairData();
  if (allData.length === 0) return [];

  const rows: ChairComparisonRow[] = DELEGATIONS.map((name) => {
    const chairs = allData.map((cd) => {
      const ranking = cd.rankings.find((r) => r.name === name);
      return {
        chairId: cd.chairId,
        chairName: cd.chairName,
        totalScore: ranking?.totalScore ?? 0,
        speechScore: ranking?.speechScore ?? 0,
        poiScore: ranking?.poiAskedScore ?? 0,
        responseScore: ranking?.poiResponseScore ?? 0,
        directiveScore: ranking?.directiveScore ?? 0,
        rank: ranking?.rank ?? 0,
      };
    });

    const getCategoryScore = (c: typeof chairs[0]) => {
      switch (category) {
        case "speeches": return c.speechScore;
        case "pois": return c.poiScore;
        case "responses": return c.responseScore;
        case "directives": return c.directiveScore;
        default: return c.totalScore;
      }
    };

    const scores = chairs.map(getCategoryScore);
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
    const maxDiff = scores.length > 1
      ? Math.max(...scores) - Math.min(...scores)
      : 0;

    return {
      delegation: name,
      chairs,
      averageTotal: Math.round(avg * 100) / 100,
      maxDifference: Math.round(maxDiff * 100) / 100,
    };
  });

  // Sort by average of selected category
  rows.sort((a, b) => b.averageTotal - a.averageTotal);
  return rows;
}
