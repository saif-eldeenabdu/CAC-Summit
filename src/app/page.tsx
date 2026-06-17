"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcRankings } from "@/store/scoring";
import {
  Mic,
  HelpCircle,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import { slugify, ordinalSuffix } from "@/lib/utils";

export default function DashboardPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const committeeInfo = useCommitteeStore((s) => s.committeeInfo);

  const rankings = useMemo(() => calcRankings(delegations), [delegations]);

  // Aggregate stats
  const stats = useMemo(() => {
    const all = Object.values(delegations);
    return {
      totalSpeeches: all.reduce((s, d) => s + d.speeches.length, 0),
      totalPOIs: all.reduce((s, d) => s + d.poisAsked.length, 0),
      totalResponses: all.reduce((s, d) => s + d.poiResponses.length, 0),
      totalDirectives: all.reduce((s, d) => s + d.directives.length, 0),
      passedDirectives: all.reduce(
        (s, d) => s + d.directives.filter((dir) => dir.status === "Passed").length,
        0
      ),
      failedDirectives: all.reduce(
        (s, d) => s + d.directives.filter((dir) => dir.status === "Failed").length,
        0
      ),
    };
  }, [delegations]);

  const statCards = [
    { label: "Total Speeches", value: stats.totalSpeeches, icon: Mic, color: "text-accent" },
    { label: "POIs Asked", value: stats.totalPOIs, icon: HelpCircle, color: "text-info" },
    { label: "POI Responses", value: stats.totalResponses, icon: MessageCircle, color: "text-purple-400" },
    { label: "Total Directives", value: stats.totalDirectives, icon: FileText, color: "text-warning" },
    { label: "Passed", value: stats.passedDirectives, icon: CheckCircle, color: "text-success" },
    { label: "Failed", value: stats.failedDirectives, icon: XCircle, color: "text-danger" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{committeeInfo.name || "Dashboard"}</h1>
            {committeeInfo.topic && (
              <p className="text-sm text-muted">{committeeInfo.topic}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-xs text-muted font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          href="/quick-debate"
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors"
        >
          <Zap size={18} />
          Quick Debate Mode
        </Link>
      </div>

      {/* Leaderboard */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Trophy size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted uppercase tracking-wider border-b border-border">
                <th className="px-6 py-3 text-left w-16">Rank</th>
                <th className="px-6 py-3 text-left">Delegation</th>
                <th className="px-6 py-3 text-right">Speeches</th>
                <th className="px-6 py-3 text-right">POIs</th>
                <th className="px-6 py-3 text-right">Directives</th>
                <th className="px-6 py-3 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings.map((r) => {
                const d = delegations[r.name];
                const rankColor =
                  r.rank === 1
                    ? "text-gold"
                    : r.rank === 2
                    ? "text-silver"
                    : r.rank === 3
                    ? "text-bronze"
                    : "text-muted";
                return (
                  <tr
                    key={r.name}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-3">
                      <span className={`font-bold text-lg ${rankColor}`}>
                        {r.rank <= 3 ? (
                          <span className="flex items-center gap-1.5">
                            {r.rank === 1 && "🥇"}
                            {r.rank === 2 && "🥈"}
                            {r.rank === 3 && "🥉"}
                          </span>
                        ) : (
                          ordinalSuffix(r.rank)
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/delegation/${slugify(r.name)}`}
                        className="font-medium text-foreground group-hover:text-accent transition-colors"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.speeches.length}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.poisAsked.length + d.poiResponses.length}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-light">
                      {d.directives.length}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold text-accent">{r.totalScore.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
