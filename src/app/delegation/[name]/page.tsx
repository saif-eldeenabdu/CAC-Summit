"use client";

import React, { useState, useMemo, use } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import {
  calcRankings,
  calcTotalScore,
  calcCategoryScores,
  calcAverageSpeechScore,
  calcAveragePOIQuality,
  calcAverageResponseQuality,
  calcAverageDirectiveQuality,
  calcDirectivePassRate,
  getAwardRecommendation,
} from "@/store/scoring";
import { deslugify, formatDateTime, ordinalSuffix } from "@/lib/utils";
import {
  ArrowLeft,
  Trophy,
  Mic,
  HelpCircle,
  MessageCircle,
  FileText,
  BarChart3,
  StickyNote,
  Crown,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";
import AddSpeechModal from "@/components/modals/AddSpeechModal";
import AddPOIModal from "@/components/modals/AddPOIModal";
import AddResponseModal from "@/components/modals/AddResponseModal";
import AddDirectiveModal from "@/components/modals/AddDirectiveModal";
import AddNoteModal from "@/components/modals/AddNoteModal";
import AddLeadershipModal from "@/components/modals/AddLeadershipModal";
import type { DirectiveStatus } from "@/store/types";
import { useToast } from "@/components/ui/Toast";

type TabKey = "speeches" | "pois" | "responses" | "directives" | "analytics" | "notes";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "speeches", label: "Speeches", icon: Mic },
  { key: "pois", label: "POIs Asked", icon: HelpCircle },
  { key: "responses", label: "POI Responses", icon: MessageCircle },
  { key: "directives", label: "Directives", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "notes", label: "Notes", icon: StickyNote },
];

export default function DelegationProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: slug } = use(params);
  const name = deslugify(slug);
  const delegations = useCommitteeStore((s) => s.delegations);
  const delegation = delegations[name];
  const setChairDiscretion = useCommitteeStore((s) => s.setChairDiscretion);
  const setChairNotes = useCommitteeStore((s) => s.setChairNotes);
  const deleteSpeech = useCommitteeStore((s) => s.deleteSpeech);
  const deletePOI = useCommitteeStore((s) => s.deletePOI);
  const deletePOIResponse = useCommitteeStore((s) => s.deletePOIResponse);
  const deleteDirective = useCommitteeStore((s) => s.deleteDirective);
  const updateDirectiveStatus = useCommitteeStore((s) => s.updateDirectiveStatus);
  const deleteNote = useCommitteeStore((s) => s.deleteNote);
  const deleteLeadershipEvent = useCommitteeStore((s) => s.deleteLeadershipEvent);
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("speeches");
  const [modal, setModal] = useState<string | null>(null);

  const rankings = useMemo(() => calcRankings(delegations), [delegations]);
  const myRank = rankings.find((r) => r.name === name)?.rank ?? 0;
  const totalScore = delegation ? calcTotalScore(delegation) : 0;
  const categoryScores = delegation ? calcCategoryScores(delegation) : null;
  const awardRec = getAwardRecommendation(myRank);

  if (!delegation) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Delegation not found: {name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/quick-debate" className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`flex items-center gap-1 text-sm font-semibold ${
              myRank === 1 ? "text-gold" : myRank === 2 ? "text-silver" : myRank === 3 ? "text-bronze" : "text-muted"
            }`}>
              {myRank <= 3 && <Crown size={14} />}
              {ordinalSuffix(myRank)} place
            </span>
            <span className="text-muted">·</span>
            <span className="text-sm text-accent font-bold">{totalScore.toFixed(2)} pts</span>
            {awardRec && (
              <>
                <span className="text-muted">·</span>
                <span className="badge bg-accent/20 text-accent border border-accent/30">
                  <Trophy size={12} /> {awardRec}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryScores && [
          { label: "Speeches", value: categoryScores.speeches.toFixed(1), color: "text-accent" },
          { label: "POIs Asked", value: categoryScores.poisAsked, color: "text-info" },
          { label: "POI Responses", value: categoryScores.poiResponses, color: "text-purple-400" },
          { label: "Directives", value: categoryScores.directives.toFixed(1), color: "text-warning" },
          { label: "Leadership", value: categoryScores.leadership, color: "text-success" },
          { label: "Discretion", value: `${categoryScores.chairDiscretion}/20`, color: "text-accent" },
        ].map((c) => (
          <div key={c.label} className="glass-card p-3 text-center">
            <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">{c.label}</div>
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Chair Discretion & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Star size={16} className="text-accent" /> Chair Discretion
            </h3>
            <span className="text-lg font-bold text-accent">{delegation.chairDiscretion}/20</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            value={delegation.chairDiscretion}
            onChange={(e) => setChairDiscretion(name, Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>0</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Chair Notes</h3>
          <textarea
            value={delegation.chairNotes}
            onChange={(e) => setChairNotes(name, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
            placeholder="Private notes about this delegate..."
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? "tab-active" : "tab-inactive"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* ── Speeches ── */}
        {activeTab === "speeches" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                {delegation.speeches.length} speeches · Avg: {calcAverageSpeechScore(delegation).toFixed(2)}
              </div>
              <button onClick={() => setModal("speech")} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors">
                <Plus size={14} /> Add Speech
              </button>
            </div>
            {delegation.speeches.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted">No speeches recorded yet</div>
            ) : (
              delegation.speeches.slice().reverse().map((s) => (
                <div key={s.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-accent/20 text-accent">{s.type}</span>
                      <span className="text-xs text-muted">{formatDateTime(s.timestamp)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-light mt-2">
                      <span>Research: <strong className="text-foreground">{s.informationResearch}</strong></span>
                      <span>Delivery: <strong className="text-foreground">{s.delivery}</strong></span>
                      <span>Creativity: <strong className="text-foreground">{s.creativity}</strong></span>
                      <span>Passion: <strong className="text-foreground">{s.passion}</strong></span>
                    </div>
                    {s.notes && <p className="text-xs text-muted mt-2 italic">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold gradient-text">{s.weightedScore.toFixed(2)}</span>
                    <button onClick={() => { deleteSpeech(name, s.id); addToast("Speech deleted", "info"); }} className="p-1 text-muted hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── POIs Asked ── */}
        {activeTab === "pois" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                {delegation.poisAsked.length} POIs · Avg: {calcAveragePOIQuality(delegation).toFixed(1)}
              </div>
              <button onClick={() => setModal("poi")} className="flex items-center gap-1.5 px-3 py-1.5 bg-info/20 text-info rounded-lg text-sm font-medium hover:bg-info/30 transition-colors">
                <Plus size={14} /> Add POI
              </button>
            </div>
            {delegation.poisAsked.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted">No POIs recorded yet</div>
            ) : (
              delegation.poisAsked.slice().reverse().map((p) => (
                <div key={p.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${
                      p.quality === "Excellent" ? "bg-success/20 text-success" :
                      p.quality === "Good" ? "bg-info/20 text-info" :
                      p.quality === "Average" ? "bg-warning/20 text-warning" :
                      "bg-danger/20 text-danger"
                    }`}>{p.quality}</span>
                    <span className="text-xs text-muted">{formatDateTime(p.timestamp)}</span>
                    {p.notes && <span className="text-xs text-muted italic">{p.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-info">+{p.points}</span>
                    <button onClick={() => { deletePOI(name, p.id); addToast("POI deleted", "info"); }} className="p-1 text-muted hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── POI Responses ── */}
        {activeTab === "responses" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                {delegation.poiResponses.length} responses · Avg: {calcAverageResponseQuality(delegation).toFixed(1)}
              </div>
              <button onClick={() => setModal("response")} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors">
                <Plus size={14} /> Add Response
              </button>
            </div>
            {delegation.poiResponses.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted">No responses recorded yet</div>
            ) : (
              delegation.poiResponses.slice().reverse().map((r) => (
                <div key={r.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${
                      r.quality === "Excellent" ? "bg-success/20 text-success" :
                      r.quality === "Good" ? "bg-info/20 text-info" :
                      r.quality === "Average" ? "bg-warning/20 text-warning" :
                      "bg-danger/20 text-danger"
                    }`}>{r.quality}</span>
                    <span className="text-xs text-muted">{formatDateTime(r.timestamp)}</span>
                    {r.notes && <span className="text-xs text-muted italic">{r.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-400">+{r.points}</span>
                    <button onClick={() => { deletePOIResponse(name, r.id); addToast("Response deleted", "info"); }} className="p-1 text-muted hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Directives ── */}
        {activeTab === "directives" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                {delegation.directives.length} directives · Pass rate: {calcDirectivePassRate(delegation)}% · Avg quality: {calcAverageDirectiveQuality(delegation).toFixed(1)}
              </div>
              <button onClick={() => setModal("directive")} className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/20 text-warning rounded-lg text-sm font-medium hover:bg-warning/30 transition-colors">
                <Plus size={14} /> Add Directive
              </button>
            </div>
            {delegation.directives.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted">No directives recorded yet</div>
            ) : (
              delegation.directives.slice().reverse().map((d) => (
                <div key={d.id} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{d.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                        <span>{d.topic}</span>
                        <span>·</span>
                        <span>{d.submissionType}</span>
                        <span>·</span>
                        <span>{formatDateTime(d.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold gradient-text">{d.qualityScore.toFixed(1)}</span>
                      {d.passBonus > 0 && <span className="badge bg-success/20 text-success">+{d.passBonus} bonus</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-light mb-3">
                    <span>Research: <strong className="text-foreground">{d.researchQuality}</strong></span>
                    <span>Practical: <strong className="text-foreground">{d.practicality}</strong></span>
                    <span>Creative: <strong className="text-foreground">{d.creativity}</strong></span>
                    <span>Diplomatic: <strong className="text-foreground">{d.diplomaticValue}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["Pending", "Passed", "Failed"] as DirectiveStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { updateDirectiveStatus(name, d.id, s); addToast(`Directive ${s.toLowerCase()}`, s === "Passed" ? "success" : s === "Failed" ? "error" : "info"); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                          d.status === s
                            ? s === "Passed" ? "bg-success/20 text-success border-success/40" :
                              s === "Failed" ? "bg-danger/20 text-danger border-danger/40" :
                              "bg-warning/20 text-warning border-warning/40"
                            : "bg-surface text-muted border-border hover:border-border-light"
                        }`}
                      >
                        {s === "Passed" && <CheckCircle size={12} />}
                        {s === "Failed" && <XCircle size={12} />}
                        {s === "Pending" && <Clock size={12} />}
                        {s}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button onClick={() => { deleteDirective(name, d.id); addToast("Directive deleted", "info"); }} className="p-1 text-muted hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "analytics" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Avg Speech Score", value: calcAverageSpeechScore(delegation).toFixed(2) },
                { label: "Total Speeches", value: delegation.speeches.length },
                { label: "Avg POI Quality", value: calcAveragePOIQuality(delegation).toFixed(1) },
                { label: "Avg Response Quality", value: calcAverageResponseQuality(delegation).toFixed(1) },
                { label: "Directive Pass Rate", value: `${calcDirectivePassRate(delegation)}%` },
                { label: "Avg Directive Quality", value: calcAverageDirectiveQuality(delegation).toFixed(1) },
              ].map((m) => (
                <div key={m.label} className="glass-card p-4 text-center">
                  <div className="text-xs text-muted uppercase tracking-wider mb-1">{m.label}</div>
                  <div className="text-2xl font-bold text-accent">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Leadership events */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Leadership Events</h3>
                <button onClick={() => setModal("leadership")} className="flex items-center gap-1 px-2.5 py-1 bg-success/20 text-success rounded-lg text-xs font-medium hover:bg-success/30">
                  <Plus size={12} /> Add
                </button>
              </div>
              {delegation.leadershipEvents.length === 0 ? (
                <p className="text-sm text-muted">No leadership events recorded</p>
              ) : (
                <div className="space-y-2">
                  {delegation.leadershipEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm text-foreground">{e.description}</span>
                        <span className="text-xs text-muted ml-2">{formatDateTime(e.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-success">+{e.points}</span>
                        <button onClick={() => { deleteLeadershipEvent(name, e.id); addToast("Event deleted", "info"); }} className="p-1 text-muted hover:text-danger">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {activeTab === "notes" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">{delegation.notes.length} notes</div>
              <button onClick={() => setModal("note")} className="flex items-center gap-1.5 px-3 py-1.5 bg-success/20 text-success rounded-lg text-sm font-medium hover:bg-success/30 transition-colors">
                <Plus size={14} /> Add Note
              </button>
            </div>
            {delegation.notes.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted">No notes yet</div>
            ) : (
              delegation.notes.slice().reverse().map((n) => (
                <div key={n.id} className="glass-card p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-foreground">{n.content}</p>
                    <p className="text-xs text-muted mt-1">{formatDateTime(n.timestamp)}</p>
                  </div>
                  <button onClick={() => { deleteNote(name, n.id); addToast("Note deleted", "info"); }} className="p-1 text-muted hover:text-danger transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSpeechModal isOpen={modal === "speech"} onClose={() => setModal(null)} delegation={name} />
      <AddPOIModal isOpen={modal === "poi"} onClose={() => setModal(null)} delegation={name} />
      <AddResponseModal isOpen={modal === "response"} onClose={() => setModal(null)} delegation={name} />
      <AddDirectiveModal isOpen={modal === "directive"} onClose={() => setModal(null)} delegation={name} />
      <AddNoteModal isOpen={modal === "note"} onClose={() => setModal(null)} delegation={name} />
      <AddLeadershipModal isOpen={modal === "leadership"} onClose={() => setModal(null)} delegation={name} />
    </div>
  );
}
