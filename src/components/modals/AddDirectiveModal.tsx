"use client";

import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import type { SubmissionType, DirectiveStatus } from "@/store/types";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcDirectiveQualityScore } from "@/store/scoring";
import { useToast } from "@/components/ui/Toast";

interface AddDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: string;
}

const SUBMISSION_TYPES: SubmissionType[] = ["Individual", "Co-Author", "Sponsor"];

export default function AddDirectiveModal({ isOpen, onClose, delegation }: AddDirectiveModalProps) {
  const addDirective = useCommitteeStore((s) => s.addDirective);
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [submissionType, setSubmissionType] = useState<SubmissionType>("Individual");
  const [researchQuality, setResearchQuality] = useState(5);
  const [practicality, setPracticality] = useState(5);
  const [creativity, setCreativity] = useState(5);
  const [diplomaticValue, setDiplomaticValue] = useState(5);
  const [status, setStatus] = useState<DirectiveStatus>("Pending");
  const [notes, setNotes] = useState("");

  const preview = useMemo(
    () => calcDirectiveQualityScore({ researchQuality, practicality, creativity, diplomaticValue }),
    [researchQuality, practicality, creativity, diplomaticValue]
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    addDirective(delegation, {
      title,
      topic,
      submissionType,
      researchQuality,
      practicality,
      creativity,
      diplomaticValue,
      status,
      notes,
    });
    addToast(`Directive added for ${delegation} — Quality: ${preview.toFixed(1)}`);
    setTitle("");
    setTopic("");
    setSubmissionType("Individual");
    setResearchQuality(5);
    setPracticality(5);
    setCreativity(5);
    setDiplomaticValue(5);
    setStatus("Pending");
    setNotes("");
    onClose();
  };

  const sliders = [
    { label: "Research Quality", value: researchQuality, set: setResearchQuality },
    { label: "Practicality", value: practicality, set: setPracticality },
    { label: "Creativity", value: creativity, set: setCreativity },
    { label: "Diplomatic Value", value: diplomaticValue, set: setDiplomaticValue },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Directive — ${delegation}`} maxWidth="max-w-xl">
      {/* Title & Topic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-light mb-1">Directive Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
            placeholder="e.g. Resolution on..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-light mb-1">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
            placeholder="e.g. Economic reform"
          />
        </div>
      </div>

      {/* Submission Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-light mb-2">Submission Type</label>
        <div className="flex gap-2">
          {SUBMISSION_TYPES.map((st) => (
            <button
              key={st}
              onClick={() => setSubmissionType(st)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                submissionType === st
                  ? "bg-accent/20 text-accent border-accent/40"
                  : "bg-surface text-muted-light border-border hover:border-border-light"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3 mb-4">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-muted-light">{s.label}</label>
              <span className="text-sm font-bold text-accent w-6 text-right">{s.value}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Score Preview */}
      <div className="glass-card p-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-light">Quality Score</span>
        <span className="text-2xl font-bold gradient-text">{preview.toFixed(2)}</span>
      </div>

      {/* Status */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-light mb-2">Initial Status</label>
        <div className="flex gap-2">
          {(["Pending", "Passed", "Failed"] as DirectiveStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                status === s
                  ? s === "Passed"
                    ? "bg-success/20 text-success border-success/40"
                    : s === "Failed"
                    ? "bg-danger/20 text-danger border-danger/40"
                    : "bg-warning/20 text-warning border-warning/40"
                  : "bg-surface text-muted-light border-border hover:border-border-light"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-muted-light mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
          placeholder="Notes about this directive..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-background font-semibold rounded-lg transition-colors"
      >
        Add Directive
      </button>
    </Modal>
  );
}
