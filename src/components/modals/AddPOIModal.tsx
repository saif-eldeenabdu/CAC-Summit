"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { QualityRating } from "@/store/types";
import { useCommitteeStore } from "@/store/committeeStore";
import { POI_ASKED_POINTS } from "@/store/scoring";
import { useToast } from "@/components/ui/Toast";

interface AddPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: string;
}

const RATINGS: { value: QualityRating; color: string }[] = [
  { value: "Poor", color: "bg-danger/20 text-danger border-danger/40 hover:bg-danger/30" },
  { value: "Average", color: "bg-warning/20 text-warning border-warning/40 hover:bg-warning/30" },
  { value: "Good", color: "bg-info/20 text-info border-info/40 hover:bg-info/30" },
  { value: "Excellent", color: "bg-success/20 text-success border-success/40 hover:bg-success/30" },
];

export default function AddPOIModal({ isOpen, onClose, delegation }: AddPOIModalProps) {
  const addPOI = useCommitteeStore((s) => s.addPOI);
  const { addToast } = useToast();
  const [notes, setNotes] = useState("");

  const handleRate = (quality: QualityRating) => {
    addPOI(delegation, quality, notes);
    const pts = POI_ASKED_POINTS[quality];
    addToast(`POI Asked: ${quality} (+${pts} pts) — ${delegation}`);
    setNotes("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add POI Asked — ${delegation}`}>
      <p className="text-sm text-muted mb-4">Rate the quality of the point of information asked.</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRate(r.value)}
            className={`flex flex-col items-center gap-1 px-4 py-4 rounded-xl border transition-all ${r.color}`}
          >
            <span className="text-lg font-bold">{POI_ASKED_POINTS[r.value]}</span>
            <span className="text-xs font-medium">{r.value}</span>
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-light mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
          placeholder="Quick note..."
        />
      </div>
    </Modal>
  );
}
