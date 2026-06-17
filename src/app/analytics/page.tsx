"use client";

import React, { useMemo } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcRankings, calcAverageSpeechScore, calcAveragePOIQuality, calcAverageResponseQuality, calcAverageDirectiveQuality, calcDirectivePassRate } from "@/store/scoring";
import { BarChart3, Mic, HelpCircle, MessageCircle, FileText, Award } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const rankings = useMemo(() => calcRankings(delegations), [delegations]);

  // Top speakers by average speech score
  const topSpeakers = useMemo(() => {
    return Object.values(delegations)
      .filter((d) => d.speeches.length > 0)
      .map((d) => ({ name: d.name, avgScore: calcAverageSpeechScore(d), count: d.speeches.length }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
  }, [delegations]);

  // Most active by total activities
  const mostActive = useMemo(() => {
    return Object.values(delegations)
      .map((d) => ({
        name: d.name,
        total: d.speeches.length + d.poisAsked.length + d.poiResponses.length + d.directives.length,
        speeches: d.speeches.length,
        pois: d.poisAsked.length,
        responses: d.poiResponses.length,
        directives: d.directives.length,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [delegations]);

  // Score breakdown chart data
  const scoreBreakdown = useMemo(() => {
    return rankings.slice(0, 15).map((r) => ({
      name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
      fullName: r.name,
      speeches: Number((r.speechScore * 0.4).toFixed(2)),
      pois: Number((r.poiAskedScore * 0.1).toFixed(2)),
      responses: Number((r.poiResponseScore * 0.15).toFixed(2)),
      directives: Number((r.directiveScore * 0.25).toFixed(2)),
      discretion: Number((r.chairDiscretion * 0.1).toFixed(2)),
    }));
  }, [rankings]);

  // Best POI questioners
  const bestPOI = useMemo(() => {
    return Object.values(delegations)
      .filter((d) => d.poisAsked.length > 0)
      .map((d) => ({ name: d.name, avg: calcAveragePOIQuality(d), count: d.poisAsked.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [delegations]);

  // Best POI responders
  const bestResponders = useMemo(() => {
    return Object.values(delegations)
      .filter((d) => d.poiResponses.length > 0)
      .map((d) => ({ name: d.name, avg: calcAverageResponseQuality(d), count: d.poiResponses.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [delegations]);

  // Top directive authors
  const topDirective = useMemo(() => {
    return Object.values(delegations)
      .filter((d) => d.directives.length > 0)
      .map((d) => ({
        name: d.name,
        avgQuality: calcAverageDirectiveQuality(d),
        passRate: calcDirectivePassRate(d),
        count: d.directives.length,
      }))
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .slice(0, 10);
  }, [delegations]);

  const ACCENT_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="glass-card p-3 text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
            <span>{p.name}:</span> <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <BarChart3 size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted">Committee performance insights</p>
        </div>
      </div>

      {/* Score Breakdown Stacked Bar */}
      {scoreBreakdown.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Score Breakdown by Delegation</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBreakdown} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="speeches" stackId="a" fill="#f59e0b" name="Speeches" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pois" stackId="a" fill="#3b82f6" name="POIs" />
                <Bar dataKey="responses" stackId="a" fill="#a855f7" name="Responses" />
                <Bar dataKey="directives" stackId="a" fill="#10b981" name="Directives" />
                <Bar dataKey="discretion" stackId="a" fill="#ef4444" name="Discretion" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lists grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Speakers */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Mic size={16} className="text-accent" /> Top Speakers (Avg Score)
          </h3>
          {topSpeakers.length === 0 ? (
            <p className="text-sm text-muted">No speeches yet</p>
          ) : (
            <div className="space-y-2">
              {topSpeakers.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <Link href={`/delegation/${slugify(s.name)}`} className="text-sm text-foreground hover:text-accent transition-colors">{s.name}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{s.count} speeches</span>
                    <span className="font-bold text-accent">{s.avgScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Active */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Award size={16} className="text-success" /> Most Active Delegates
          </h3>
          {mostActive.length === 0 || mostActive[0].total === 0 ? (
            <p className="text-sm text-muted">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {mostActive.filter((a) => a.total > 0).map((a, i) => (
                <div key={a.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <Link href={`/delegation/${slugify(a.name)}`} className="text-sm text-foreground hover:text-accent transition-colors">{a.name}</Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-accent">{a.speeches}sp</span>
                    <span className="text-info">{a.pois}p</span>
                    <span className="text-purple-400">{a.responses}r</span>
                    <span className="text-warning">{a.directives}d</span>
                    <span className="font-bold text-foreground">{a.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best POI Questioners */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <HelpCircle size={16} className="text-info" /> Best POI Questioners
          </h3>
          {bestPOI.length === 0 ? (
            <p className="text-sm text-muted">No POIs yet</p>
          ) : (
            <div className="space-y-2">
              {bestPOI.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <Link href={`/delegation/${slugify(p.name)}`} className="text-sm text-foreground hover:text-accent transition-colors">{p.name}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{p.count} POIs</span>
                    <span className="font-bold text-info">{p.avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Responders */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-purple-400" /> Best POI Responders
          </h3>
          {bestResponders.length === 0 ? (
            <p className="text-sm text-muted">No responses yet</p>
          ) : (
            <div className="space-y-2">
              {bestResponders.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <Link href={`/delegation/${slugify(r.name)}`} className="text-sm text-foreground hover:text-accent transition-colors">{r.name}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{r.count} responses</span>
                    <span className="font-bold text-purple-400">{r.avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Directive Authors */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <FileText size={16} className="text-warning" /> Top Directive Authors
          </h3>
          {topDirective.length === 0 ? (
            <p className="text-sm text-muted">No directives yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topDirective.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-5">{i + 1}.</span>
                    <Link href={`/delegation/${slugify(d.name)}`} className="text-sm text-foreground hover:text-accent transition-colors">{d.name}</Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted">{d.count} directives</span>
                    <span className="text-success">{d.passRate}% pass</span>
                    <span className="font-bold text-warning">{d.avgQuality.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participation Heatmap */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Participation Heatmap</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-muted font-medium">Delegation</th>
                <th className="text-center py-2 px-2 text-muted font-medium">Speeches</th>
                <th className="text-center py-2 px-2 text-muted font-medium">POIs</th>
                <th className="text-center py-2 px-2 text-muted font-medium">Responses</th>
                <th className="text-center py-2 px-2 text-muted font-medium">Directives</th>
                <th className="text-center py-2 px-2 text-muted font-medium">Leadership</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => {
                const d = delegations[r.name];
                const heatColor = (val: number, max: number) => {
                  if (max === 0 || val === 0) return "bg-surface";
                  const intensity = Math.min(val / Math.max(max, 1), 1);
                  if (intensity > 0.7) return "bg-accent/40 text-accent";
                  if (intensity > 0.4) return "bg-accent/20 text-accent";
                  return "bg-accent/10 text-muted-light";
                };
                const maxS = Math.max(...Object.values(delegations).map((x) => x.speeches.length));
                const maxP = Math.max(...Object.values(delegations).map((x) => x.poisAsked.length));
                const maxR = Math.max(...Object.values(delegations).map((x) => x.poiResponses.length));
                const maxD = Math.max(...Object.values(delegations).map((x) => x.directives.length));
                const maxL = Math.max(...Object.values(delegations).map((x) => x.leadershipEvents.length));
                return (
                  <tr key={r.name} className="border-t border-border/50">
                    <td className="py-1.5 pr-4">
                      <Link href={`/delegation/${slugify(r.name)}`} className="text-foreground hover:text-accent transition-colors">
                        {r.name}
                      </Link>
                    </td>
                    <td className={`text-center py-1.5 px-2 rounded ${heatColor(d.speeches.length, maxS)}`}>{d.speeches.length}</td>
                    <td className={`text-center py-1.5 px-2 rounded ${heatColor(d.poisAsked.length, maxP)}`}>{d.poisAsked.length}</td>
                    <td className={`text-center py-1.5 px-2 rounded ${heatColor(d.poiResponses.length, maxR)}`}>{d.poiResponses.length}</td>
                    <td className={`text-center py-1.5 px-2 rounded ${heatColor(d.directives.length, maxD)}`}>{d.directives.length}</td>
                    <td className={`text-center py-1.5 px-2 rounded ${heatColor(d.leadershipEvents.length, maxL)}`}>{d.leadershipEvents.length}</td>
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
