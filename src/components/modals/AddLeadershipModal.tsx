"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCommitteeStore } from "@/store/committeeStore";
import { useToast } from "@/components/ui/Toast";

interface AddLeadershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: string;
}

const PRESETS = [
  { label: "Led working group", points: 3 },
  { label: "Organized bloc", points: 4 },
  { label: "Main sponsor of directive", points: 5 },
  { label: "Negotiated compromise", points: 3 },
  { label: "Crisis leadership", points: 4 },
  { label: "Coalition building", points: 3 },
];

export default function AddLeadershipModal({ isOpen, onClose, delegation }: AddLeadershipModalProps) {
  const addLeadershipEvent = useCommitteeStore((s) => s.addLeadershipEvent);
  const { addToast } = useToast();
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(3);

  const handleSubmit = () => {
    if (!description.trim()) return;
    addLeadershipEvent(delegation, description, points);
    addToast(`Leadership: +${points} pts — ${delegation}`);
    setDescription("");
    setPoints(3);
    onClose();
  };

  const handlePreset = (preset: { label: string; points: number }) => {
    addLeadershipEvent(delegation, preset.label, preset.points);
    addToast(`Leadership: +${preset.points} pts — ${delegation}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Leadership — ${delegation}`}>
      {/* Presets */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-muted-light mb-2">Quick Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm hover:border-accent/40 hover:bg-accent/5 transition-all"
            >
              <span className="text-muted-light">{p.label}</span>
              <span className="text-accent font-bold">+{p.points}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-card text-xs text-muted">or custom</span>
        </div>
      </div>

      {/* Custom */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-muted-light mb-1">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
          placeholder="Describe the leadership action..."
        />
      </div>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-muted-light">Points</label>
          <span className="text-sm font-bold text-accent">{points}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!description.trim()}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-background font-semibold rounded-lg transition-colors"
      >
        Add Leadership Event
      </button>
    </Modal>
  );
}
