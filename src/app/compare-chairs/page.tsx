"use client";

import React, { useState, useMemo } from "react";
import { GitCompare, AlertTriangle } from "lucide-react";
import { calcChairComparison, type CategoryFilter } from "@/lib/multiChairUtils";
import { useChairStore } from "@/store/chairStore";
import Link from "next/link";
import { slugify } from "@/lib/utils";

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "total", label: "Total Score" },
  { key: "speeches", label: "Speeches" },
  { key: "pois", label: "POIs" },
  { key: "responses", label: "Responses" },
  { key: "directives", label: "Directives" },
];

export default function CompareChairsPage() {
  const chairs = useChairStore((s) => s.chairs);
  const [category, setCategory] = useState<CategoryFilter>("total");

  const comparison = useMemo(() => calcChairComparison(category), [category]);

  const getCategoryValue = (chair: typeof comparison[0]["chairs"][0]) => {
    switch (category) {
      case "speeches": return chair.speechScore;
      case "pois": return chair.poiScore;
      case "responses": return chair.responseScore;
      case "directives": return chair.directiveScore;
      default: return chair.totalScore;
    }
  };

  if (chairs.length < 2) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <GitCompare size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compare Chairs</h1>
            <p className="text-sm text-muted">Side-by-side scoring comparison</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <GitCompare size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compare Chairs</h1>
            <p className="text-sm text-muted">{chairs.length} chairs · Side-by-side comparison</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border/30 w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              category === cat.key
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted uppercase tracking-wider border-b border-border/30">
                <th className="px-6 py-3 text-left">Delegation</th>
                {chairs.map((chair) => (
                  <th key={chair.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <span className="text-accent font-bold text-[10px]">
                          {chair.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="mt-1">{chair.name}</span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Average</th>
                <th className="px-4 py-3 text-center">Spread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {comparison.filter((r) => r.averageTotal > 0).map((row) => {
                const hasHighSpread = row.maxDifference > 2;
                return (
                  <tr
                    key={row.delegation}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/delegation/${slugify(row.delegation)}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {row.delegation}
                      </Link>
                    </td>
                    {chairs.map((chair) => {
                      const chairData = row.chairs.find((c) => c.chairId === chair.id);
                      const value = chairData ? getCategoryValue(chairData) : 0;
                      return (
                        <td key={chair.id} className="px-4 py-3 text-center">
                          <span className="font-semibold text-foreground">
                            {value > 0 ? value.toFixed(2) : "—"}
                          </span>
                          {category === "total" && chairData && chairData.rank > 0 && (
                            <span className="text-[10px] text-muted block">
                              #{chairData.rank}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-accent">
                        {row.averageTotal > 0 ? row.averageTotal.toFixed(2) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        hasHighSpread ? "text-warning" : "text-muted"
                      }`}>
                        {row.maxDifference > 0 ? `±${row.maxDifference.toFixed(2)}` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {comparison.filter((r) => r.averageTotal > 0).length === 0 && (
          <div className="p-12 text-center text-muted">
            No scores recorded yet. Start scoring delegates to see comparisons.
          </div>
        )}
      </div>
    </div>
  );
}
