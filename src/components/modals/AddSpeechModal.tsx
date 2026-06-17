"use client";

import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import type { SpeechType } from "@/store/types";
import { useCommitteeStore } from "@/store/committeeStore";
import { calcSpeechWeightedScore } from "@/store/scoring";
import { useToast } from "@/components/ui/Toast";

interface AddSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: string;
}

const SPEECH_TYPES: { value: SpeechType; label: string }[] = [
  { value: "GSL", label: "General Speakers List" },
  { value: "Moderated", label: "Moderated Caucus" },
  { value: "Special", label: "Special Speech" },
  { value: "Crisis", label: "Crisis Speech" },
];

export default function AddSpeechModal({ isOpen, onClose, delegation }: AddSpeechModalProps) {
  const addSpeech = useCommitteeStore((s) => s.addSpeech);
  const { addToast } = useToast();

  const [type, setType] = useState<SpeechType>("GSL");
  const [informationResearch, setInformationResearch] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [creativity, setCreativity] = useState(5);
  const [passion, setPassion] = useState(5);
  const [notes, setNotes] = useState("");

  const preview = useMemo(
    () => calcSpeechWeightedScore({ type, informationResearch, delivery, creativity, passion, notes }),
    [type, informationResearch, delivery, creativity, passion, notes]
  );

  const handleSubmit = () => {
    addSpeech(delegation, { type, informationResearch, delivery, creativity, passion, notes });
    addToast(`Speech added for ${delegation} — Score: ${preview.toFixed(1)}`);
    // Reset
    setType("GSL");
    setInformationResearch(5);
    setDelivery(5);
    setCreativity(5);
    setPassion(5);
    setNotes("");
    onClose();
  };

  const sliders = [
    { label: "Information & Research", value: informationResearch, set: setInformationResearch, weight: "40%" },
    { label: "Delivery", value: delivery, set: setDelivery, weight: "25%" },
    { label: "Creativity", value: creativity, set: setCreativity, weight: "20%" },
    { label: "Passion", value: passion, set: setPassion, weight: "15%" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Speech — ${delegation}`}>
      {/* Speech Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-muted-light mb-2">Speech Type</label>
        <div className="grid grid-cols-2 gap-2">
          {SPEECH_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => setType(st.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                type === st.value
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : "bg-surface text-muted-light border border-border hover:border-border-light"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4 mb-5">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted-light">{s.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">×{s.weight}</span>
                <span className="text-sm font-bold text-accent w-6 text-right">{s.value}</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>

      {/* Score Preview */}
      <div className="glass-card p-4 mb-5 text-center">
        <div className="text-xs text-muted-light uppercase tracking-wider mb-1">Weighted Score</div>
        <div className="text-3xl font-bold gradient-text">{preview.toFixed(2)}</div>
        <div className="text-xs text-muted mt-1">out of 10.00</div>
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-muted-light mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
          placeholder="Quick notes about this speech..."
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors"
      >
        Add Speech
      </button>
    </Modal>
  );
}
