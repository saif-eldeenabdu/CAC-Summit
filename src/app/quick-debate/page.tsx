"use client";

import React, { useState, useMemo } from "react";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcRankings, calcTotalScore } from "@/store/scoring";
import { Search, Mic, HelpCircle, MessageCircle, FileText, StickyNote, Crown, Zap } from "lucide-react";
import AddSpeechModal from "@/components/modals/AddSpeechModal";
import AddPOIModal from "@/components/modals/AddPOIModal";
import AddResponseModal from "@/components/modals/AddResponseModal";
import AddDirectiveModal from "@/components/modals/AddDirectiveModal";
import AddNoteModal from "@/components/modals/AddNoteModal";
import { ordinalSuffix } from "@/lib/utils";
import Link from "next/link";
import { slugify } from "@/lib/utils";

type ModalType = "speech" | "poi" | "response" | "directive" | "note" | null;

export default function QuickDebatePage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const rankings = useMemo(() => calcRankings(delegations), [delegations]);

  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeDelegation, setActiveDelegation] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rankings.filter((r) => r.name.toLowerCase().includes(term));
  }, [rankings, search]);

  const openModal = (delegation: string, modal: ModalType) => {
    setActiveDelegation(delegation);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveDelegation("");
  };

  const actionButtons = [
    { key: "speech" as ModalType, icon: Mic, label: "Speech", color: "hover:bg-accent/20 hover:text-accent hover:border-accent/40" },
    { key: "poi" as ModalType, icon: HelpCircle, label: "POI", color: "hover:bg-info/20 hover:text-info hover:border-info/40" },
    { key: "response" as ModalType, icon: MessageCircle, label: "Response", color: "hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/40" },
    { key: "directive" as ModalType, icon: FileText, label: "Directive", color: "hover:bg-warning/20 hover:text-warning hover:border-warning/40" },
    { key: "note" as ModalType, icon: StickyNote, label: "Note", color: "hover:bg-success/20 hover:text-success hover:border-success/40" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Zap size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quick Debate Mode</h1>
            <p className="text-sm text-muted">Score delegates in seconds during live debate</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search delegations..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 stagger-children">
        {filtered.map((r) => {
          const d = delegations[r.name];
          const isTop3 = r.rank <= 3;
          return (
            <div
              key={r.name}
              className={`glass-card glass-card-hover p-4 flex flex-col ${
                isTop3 ? "ring-1 ring-accent/20" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Link href={`/delegation/${slugify(r.name)}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate hover:text-accent transition-colors">
                    {r.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {r.rank <= 3 && <Crown size={14} className="text-accent" />}
                  <span className={`text-xs font-bold ${
                    r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-silver" : r.rank === 3 ? "text-bronze" : "text-muted"
                  }`}>
                    {ordinalSuffix(r.rank)}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold gradient-text">{r.totalScore.toFixed(1)}</span>
                <span className="text-xs text-muted">pts</span>
              </div>

              {/* Activity indicators */}
              <div className="flex items-center gap-3 text-xs text-muted mb-3">
                <span className="flex items-center gap-1"><Mic size={12} /> {d.speeches.length}</span>
                <span className="flex items-center gap-1"><HelpCircle size={12} /> {d.poisAsked.length}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {d.poiResponses.length}</span>
                <span className="flex items-center gap-1"><FileText size={12} /> {d.directives.length}</span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-5 gap-1.5 mt-auto">
                {actionButtons.map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => openModal(r.name, btn.key)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border border-border text-muted transition-all ${btn.color}`}
                    title={btn.label}
                  >
                    <btn.icon size={16} />
                    <span className="text-[9px] font-medium leading-none">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddSpeechModal isOpen={activeModal === "speech"} onClose={closeModal} delegation={activeDelegation} />
      <AddPOIModal isOpen={activeModal === "poi"} onClose={closeModal} delegation={activeDelegation} />
      <AddResponseModal isOpen={activeModal === "response"} onClose={closeModal} delegation={activeDelegation} />
      <AddDirectiveModal isOpen={activeModal === "directive"} onClose={closeModal} delegation={activeDelegation} />
      <AddNoteModal isOpen={activeModal === "note"} onClose={closeModal} delegation={activeDelegation} />
    </div>
  );
}
