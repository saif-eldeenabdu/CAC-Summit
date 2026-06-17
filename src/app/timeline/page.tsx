"use client";

import React, { useState, useMemo } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import { DELEGATIONS } from "@/lib/delegations";
import { formatDateTime, slugify } from "@/lib/utils";
import { Clock, Search, Filter, Mic, HelpCircle, MessageCircle, FileText, CheckCircle, XCircle, StickyNote, Star, Crown } from "lucide-react";
import Link from "next/link";
import type { ActivityType } from "@/store/types";

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  Speech: Mic,
  "POI Asked": HelpCircle,
  "POI Response": MessageCircle,
  "Directive Submitted": FileText,
  "Directive Passed": CheckCircle,
  "Directive Failed": XCircle,
  "Chair Note": StickyNote,
  "Chair Discretion": Star,
  "Leadership Event": Crown,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  Speech: "bg-accent/20 text-accent border-accent/30",
  "POI Asked": "bg-info/20 text-info border-info/30",
  "POI Response": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Directive Submitted": "bg-warning/20 text-warning border-warning/30",
  "Directive Passed": "bg-success/20 text-success border-success/30",
  "Directive Failed": "bg-danger/20 text-danger border-danger/30",
  "Chair Note": "bg-muted/20 text-muted-light border-muted/30",
  "Chair Discretion": "bg-accent/20 text-accent border-accent/30",
  "Leadership Event": "bg-success/20 text-success border-success/30",
};

const ALL_ACTIVITY_TYPES: ActivityType[] = [
  "Speech", "POI Asked", "POI Response", "Directive Submitted",
  "Directive Passed", "Directive Failed", "Chair Note", "Chair Discretion", "Leadership Event",
];

export default function TimelinePage() {
  const timeline = useCommitteeStore((s) => s.timeline);
  const [search, setSearch] = useState("");
  const [filterDelegation, setFilterDelegation] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return timeline.filter((entry) => {
      if (filterDelegation && entry.delegation !== filterDelegation) return false;
      if (filterType && entry.activityType !== filterType) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          entry.delegation.toLowerCase().includes(term) ||
          entry.details.toLowerCase().includes(term) ||
          entry.activityType.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [timeline, search, filterDelegation, filterType]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Clock size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Committee Timeline</h1>
            <p className="text-sm text-muted">{timeline.length} events recorded</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timeline..."
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              showFilters || filterDelegation || filterType
                ? "bg-accent/20 text-accent border-accent/40"
                : "bg-surface text-muted-light border-border hover:border-border-light"
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-4 flex flex-wrap gap-3 animate-fade-in">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted mb-1">Delegation</label>
            <select
              value={filterDelegation}
              onChange={(e) => setFilterDelegation(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent/50"
            >
              <option value="">All Delegations</option>
              {DELEGATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted mb-1">Activity Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent/50"
            >
              <option value="">All Types</option>
              {ALL_ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterDelegation(""); setFilterType(""); }}
              className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted">
          {timeline.length === 0
            ? "No committee activity yet. Start scoring delegates to see the timeline!"
            : "No events match your filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = ACTIVITY_ICONS[entry.activityType] || Clock;
            const colorClass = ACTIVITY_COLORS[entry.activityType] || "bg-muted/20 text-muted-light";
            return (
              <div key={entry.id} className="glass-card glass-card-hover p-4 flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/delegation/${slugify(entry.delegation)}`}
                      className="font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      {entry.delegation}
                    </Link>
                    <span className={`badge border ${colorClass}`}>
                      {entry.activityType}
                    </span>
                  </div>
                  <p className="text-sm text-muted-light mt-0.5">{entry.details}</p>
                  {entry.notes && <p className="text-xs text-muted mt-1 italic">{entry.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  {entry.scoreImpact !== 0 && (
                    <span className={`text-sm font-bold ${entry.scoreImpact > 0 ? "text-success" : "text-danger"}`}>
                      {entry.scoreImpact > 0 ? "+" : ""}{entry.scoreImpact.toFixed(1)}
                    </span>
                  )}
                  <div className="text-xs text-muted mt-0.5">{formatDateTime(entry.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
