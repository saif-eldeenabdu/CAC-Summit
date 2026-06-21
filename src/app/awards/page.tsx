"use client";

import React, { useMemo, useState } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import { useChairStore } from "@/store/chairStore";
import { calcRankings, calcCategoryScores, calcAverageSpeechScore, calcDirectivePassRate } from "@/store/scoring";
import { getAllChairData, type CategoryFilter } from "@/lib/multiChairUtils";
import { DELEGATIONS } from "@/lib/delegations";
import { Award, Trophy, Crown, Star, Mic, FileText, HelpCircle, MessageCircle, GitCompare } from "lucide-react";
import Link from "next/link";
import { slugify, ordinalSuffix } from "@/lib/utils";
import type { AwardType } from "@/store/types";

const AWARDS: { award: AwardType; emoji: string; color: string; bgColor: string }[] = [
  { award: "Best Delegate", emoji: "🥇", color: "text-gold", bgColor: "bg-gold/10 border-gold/30" },
  { award: "Outstanding Delegate", emoji: "🥈", color: "text-silver", bgColor: "bg-silver/10 border-silver/30" },
  { award: "Honorable Mention", emoji: "🥉", color: "text-bronze", bgColor: "bg-bronze/10 border-bronze/30" },
];

const FILTER_CATEGORIES: { key: CategoryFilter; label: string; icon: React.ElementType }[] = [
  { key: "total", label: "Total Score", icon: Trophy },
  { key: "speeches", label: "Speeches", icon: Mic },
  { key: "pois", label: "POIs", icon: HelpCircle },
  { key: "responses", label: "Responses", icon: MessageCircle },
  { key: "directives", label: "Directives", icon: FileText },
];

export default function AwardsPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const awardOverrides = useCommitteeStore((s) => s.awardOverrides);
  const setAwardOverride = useCommitteeStore((s) => s.setAwardOverride);
  const clearAwardOverride = useCommitteeStore((s) => s.clearAwardOverride);
  const chairs = useChairStore((s) => s.chairs);

  const [deliberationFilter, setDeliberationFilter] = useState<CategoryFilter>("total");

  const rankings = useMemo(() => calcRankings(delegations), [delegations]);
  const allChairData = useMemo(() => getAllChairData(), []);
  const hasMultipleChairs = chairs.length >= 2;

  const getAwardee = (award: AwardType, defaultRank: number) => {
    if (awardOverrides[award]) return awardOverrides[award];
    return rankings[defaultRank - 1]?.name ?? "—";
  };

  const topDelegates = rankings.slice(0, 5);

  // Get ranking value based on filter
  const getRankingValue = (chairRankings: typeof rankings, delegationName: string) => {
    const r = chairRankings.find((rank) => rank.name === delegationName);
    if (!r) return 0;
    switch (deliberationFilter) {
      case "speeches": return r.speechScore;
      case "pois": return r.poiAskedScore;
      case "responses": return r.poiResponseScore;
      case "directives": return r.directiveScore;
      default: return r.totalScore;
    }
  };

  // Sort delegations by the average of the selected category across chairs for deliberation
  const deliberationDelegations = useMemo(() => {
    if (!hasMultipleChairs) return [];
    return DELEGATIONS.map((name) => {
      const chairScores = allChairData.map((cd) => {
        const r = cd.rankings.find((rank) => rank.name === name);
        return {
          chairId: cd.chairId,
          chairName: cd.chairName,
          value: r ? getRankingValue([r], name) : 0,
          rank: r?.rank ?? 0,
        };
      });
      const avg = chairScores.reduce((s, c) => s + c.value, 0) / Math.max(chairScores.length, 1);
      return { name, chairScores, average: Math.round(avg * 100) / 100 };
    })
    .filter((d) => d.average > 0)
    .sort((a, b) => b.average - a.average);
  }, [allChairData, hasMultipleChairs, deliberationFilter]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Award size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Award Recommendations</h1>
          <p className="text-sm text-muted">Based on rankings with chair override</p>
        </div>
      </div>

      {/* Award Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AWARDS.map((a, i) => {
          const awardee = getAwardee(a.award, i + 1);
          const isOverride = !!awardOverrides[a.award];
          const delegate = delegations[awardee];
          const rank = rankings.find((r) => r.name === awardee);
          const scores = delegate ? calcCategoryScores(delegate) : null;

          return (
            <div key={a.award} className={`glass-card p-6 border ${a.bgColor}`}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{a.emoji}</div>
                <h3 className={`text-lg font-bold ${a.color}`}>{a.award}</h3>
              </div>

              {/* Current awardee */}
              <div className="text-center mb-4">
                <Link
                  href={`/delegation/${slugify(awardee)}`}
                  className="text-xl font-bold text-foreground hover:text-accent transition-colors"
                >
                  {awardee}
                </Link>
                {rank && (
                  <p className="text-sm text-muted mt-1">
                    {ordinalSuffix(rank.rank)} place · {rank.totalScore.toFixed(2)} pts
                  </p>
                )}
                {isOverride && (
                  <span className="badge bg-warning/20 text-warning border border-warning/30 mt-2">
                    Chair Override
                  </span>
                )}
              </div>

              {/* Score breakdown */}
              {scores && (
                <div className="space-y-1.5 text-xs mb-4">
                  {[
                    { label: "Speeches", value: scores.speeches.toFixed(1), icon: Mic },
                    { label: "POIs", value: scores.poisAsked, icon: HelpCircle },
                    { label: "Responses", value: scores.poiResponses, icon: MessageCircle },
                    { label: "Directives", value: scores.directives.toFixed(1), icon: FileText },
                    { label: "Discretion", value: `${scores.chairDiscretion}/20`, icon: Star },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-0.5">
                      <span className="text-muted flex items-center gap-1.5">
                        <s.icon size={12} /> {s.label}
                      </span>
                      <span className="text-foreground font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Override selector */}
              <div>
                <label className="block text-xs text-muted mb-1">Chair Override</label>
                <select
                  value={awardOverrides[a.award] ?? ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setAwardOverride(a.award, e.target.value);
                    } else {
                      clearAwardOverride(a.award);
                    }
                  }}
                  className="w-full px-2 py-1.5 bg-surface border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:border-accent/50"
                >
                  <option value="">Auto (by ranking)</option>
                  {DELEGATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Chair Deliberation */}
      {hasMultipleChairs && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitCompare size={18} className="text-accent" /> Chair Deliberation Panel
          </h2>
          <p className="text-sm text-muted mb-4">
            Each chair&apos;s ranking shown side-by-side. Filter by category to compare specific scoring dimensions.
          </p>

          {/* Category filter */}
          <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border/30 w-fit mb-6">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setDeliberationFilter(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  deliberationFilter === cat.key
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Deliberation table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-3 pr-4">#</th>
                  <th className="text-left py-3 pr-4">Delegate</th>
                  {allChairData.map((cd) => (
                    <th key={cd.chairId} className="text-center py-3 px-3">{cd.chairName}</th>
                  ))}
                  <th className="text-center py-3 px-3">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {deliberationDelegations.slice(0, 10).map((d, i) => (
                  <tr key={d.name} className="hover:bg-surface-hover">
                    <td className="py-3 pr-4">
                      <span className={`font-bold ${
                        i === 0 ? "text-gold" : i === 1 ? "text-silver" : i === 2 ? "text-bronze" : "text-muted"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/delegation/${slugify(d.name)}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {d.name}
                      </Link>
                    </td>
                    {d.chairScores.map((cs) => (
                      <td key={cs.chairId} className="text-center py-3 px-3">
                        <span className="font-semibold text-foreground">
                          {cs.value > 0 ? cs.value.toFixed(2) : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="text-center py-3 px-3">
                      <span className="font-bold text-accent">{d.average.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deliberationDelegations.length === 0 && (
            <p className="text-sm text-muted text-center py-8">No scores yet from any chair.</p>
          )}
        </div>
      )}

      {/* Top 5 Comparison (current chair's view) */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown size={18} className="text-accent" /> Top Delegates Comparison (My Scores)
        </h2>
        {topDelegates.length === 0 ? (
          <p className="text-sm text-muted">No scores yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-3 pr-4">Delegate</th>
                  <th className="text-center py-3 px-3">Total</th>
                  <th className="text-center py-3 px-3">Speeches</th>
                  <th className="text-center py-3 px-3">Avg Speech</th>
                  <th className="text-center py-3 px-3">POIs</th>
                  <th className="text-center py-3 px-3">Responses</th>
                  <th className="text-center py-3 px-3">Directives</th>
                  <th className="text-center py-3 px-3">Pass Rate</th>
                  <th className="text-center py-3 px-3">Discretion</th>
                  <th className="text-center py-3 px-3">Leadership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {topDelegates.map((r) => {
                  const d = delegations[r.name];
                  return (
                    <tr key={r.name} className="hover:bg-surface-hover">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-silver" : r.rank === 3 ? "text-bronze" : "text-muted"
                          }`}>
                            {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : ordinalSuffix(r.rank)}
                          </span>
                          <Link href={`/delegation/${slugify(r.name)}`} className="font-medium text-foreground hover:text-accent transition-colors">
                            {r.name}
                          </Link>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 font-bold text-accent">{r.totalScore.toFixed(2)}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{d.speeches.length}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{calcAverageSpeechScore(d).toFixed(2)}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{d.poisAsked.length}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{d.poiResponses.length}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{d.directives.length}</td>
                      <td className="text-center py-3 px-3 text-muted-light">{calcDirectivePassRate(d)}%</td>
                      <td className="text-center py-3 px-3 text-muted-light">{d.chairDiscretion}/20</td>
                      <td className="text-center py-3 px-3 text-muted-light">{r.leadershipScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
