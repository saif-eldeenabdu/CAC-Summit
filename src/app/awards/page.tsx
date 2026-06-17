"use client";

import React, { useMemo } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcRankings, calcCategoryScores, calcAverageSpeechScore, calcDirectivePassRate } from "@/store/scoring";
import { DELEGATIONS } from "@/lib/delegations";
import { Award, Trophy, Crown, Star, Mic, FileText, HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { slugify, ordinalSuffix } from "@/lib/utils";
import type { AwardType } from "@/store/types";

const AWARDS: { award: AwardType; emoji: string; color: string; bgColor: string }[] = [
  { award: "Best Delegate", emoji: "🥇", color: "text-gold", bgColor: "bg-gold/10 border-gold/30" },
  { award: "Outstanding Delegate", emoji: "🥈", color: "text-silver", bgColor: "bg-silver/10 border-silver/30" },
  { award: "Honorable Mention", emoji: "🥉", color: "text-bronze", bgColor: "bg-bronze/10 border-bronze/30" },
];

export default function AwardsPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const awardOverrides = useCommitteeStore((s) => s.awardOverrides);
  const setAwardOverride = useCommitteeStore((s) => s.setAwardOverride);
  const clearAwardOverride = useCommitteeStore((s) => s.clearAwardOverride);

  const rankings = useMemo(() => calcRankings(delegations), [delegations]);

  const getAwardee = (award: AwardType, defaultRank: number) => {
    if (awardOverrides[award]) return awardOverrides[award];
    return rankings[defaultRank - 1]?.name ?? "—";
  };

  const topDelegates = rankings.slice(0, 5);

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
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent/50"
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

      {/* Side-by-Side Comparison of Top 5 */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown size={18} className="text-accent" /> Top Delegates Comparison
        </h2>
        {topDelegates.length === 0 ? (
          <p className="text-sm text-muted">No scores yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted uppercase tracking-wider border-b border-border">
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
              <tbody className="divide-y divide-border">
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
