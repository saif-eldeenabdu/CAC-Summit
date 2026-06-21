"use client";

import React, { useMemo } from "react";
import { Calculator, Trophy, AlertTriangle } from "lucide-react";
import { calcCombinedRankings } from "@/lib/multiChairUtils";
import { useChairStore } from "@/store/chairStore";
import Link from "next/link";
import { slugify, ordinalSuffix } from "@/lib/utils";

export default function CombinedScoresPage() {
  const chairs = useChairStore((s) => s.chairs);
  const combined = useMemo(() => calcCombinedRankings(), []);

  if (chairs.length < 2) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Calculator size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Combined Scores</h1>
            <p className="text-sm text-muted">Averaged rankings across all chairs</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle size={32} className="text-muted mx-auto mb-3" />
          <p className="text-muted">You need at least 2 chairs to use this view.</p>
          <p className="text-sm text-muted/70 mt-1">
            Go to Settings to add more chairs, or use the login screen.
          </p>
        </div>
      </div>
    );
  }

  const activeDelegations = combined.filter((d) => d.averageTotal > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Calculator size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Combined Scores</h1>
          <p className="text-sm text-muted">
            Averaged across {chairs.length} chairs
          </p>
        </div>
      </div>

      {/* Top 3 Cards */}
      {activeDelegations.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeDelegations.slice(0, 3).map((d, i) => {
            const colors = [
              { border: "border-gold/30", bg: "bg-gold/5", text: "text-gold", emoji: "🥇" },
              { border: "border-silver/30", bg: "bg-silver/5", text: "text-silver", emoji: "🥈" },
              { border: "border-bronze/30", bg: "bg-bronze/5", text: "text-bronze", emoji: "🥉" },
            ];
            const c = colors[i];
            return (
              <div key={d.name} className={`glass-card p-6 border ${c.border} ${c.bg}`}>
                <div className="text-center mb-3">
                  <span className="text-3xl">{c.emoji}</span>
                </div>
                <Link
                  href={`/delegation/${slugify(d.name)}`}
                  className={`block text-center text-lg font-bold text-foreground hover:text-accent transition-colors`}
                >
                  {d.name}
                </Link>
                <p className="text-center text-sm text-muted mt-1">
                  Average: <span className={`font-bold ${c.text}`}>{d.averageTotal.toFixed(2)}</span>
                </p>
                {/* Per-chair breakdown */}
                <div className="mt-3 space-y-1">
                  {d.chairScores.map((cs) => (
                    <div key={cs.chairId} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{cs.chairName}</span>
                      <span className="text-foreground font-medium">{cs.totalScore.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
          <Trophy size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Combined Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted uppercase tracking-wider border-b border-border/30">
                <th className="px-6 py-3 text-left w-16">Rank</th>
                <th className="px-6 py-3 text-left">Delegation</th>
                <th className="px-6 py-3 text-right">Avg Speeches</th>
                <th className="px-6 py-3 text-right">Avg POIs</th>
                <th className="px-6 py-3 text-right">Avg Responses</th>
                <th className="px-6 py-3 text-right">Avg Directives</th>
                {chairs.map((chair) => (
                  <th key={chair.id} className="px-4 py-3 text-right">
                    {chair.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-right">Average Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {activeDelegations.map((d) => {
                const rankColor =
                  d.rank === 1
                    ? "text-gold"
                    : d.rank === 2
                    ? "text-silver"
                    : d.rank === 3
                    ? "text-bronze"
                    : "text-muted";
                return (
                  <tr key={d.name} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-3">
                      <span className={`font-bold text-lg ${rankColor}`}>
                        {d.rank <= 3 ? (
                          <span>{d.rank === 1 && "🥇"}{d.rank === 2 && "🥈"}{d.rank === 3 && "🥉"}</span>
                        ) : (
                          ordinalSuffix(d.rank)
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/delegation/${slugify(d.name)}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.averageSpeech.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.averagePOI.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.averageResponse.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.averageDirective.toFixed(2)}
                    </td>
                    {chairs.map((chair) => {
                      const cs = d.chairScores.find((c) => c.chairId === chair.id);
                      return (
                        <td key={chair.id} className="px-4 py-3 text-right text-sm text-muted-light">
                          {cs ? cs.totalScore.toFixed(2) : "—"}
                        </td>
                      );
                    })}
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold text-accent">{d.averageTotal.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {activeDelegations.length === 0 && (
          <div className="p-12 text-center text-muted">
            No scores recorded yet. Start scoring delegates to see combined rankings.
          </div>
        )}
      </div>
    </div>
  );
}
