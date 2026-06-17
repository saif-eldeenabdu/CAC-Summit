"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCommitteeStore } from "@/store/committeeStore";
import { useToast } from "@/components/ui/Toast";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: string;
}

export default function AddNoteModal({ isOpen, onClose, delegation }: AddNoteModalProps) {
  const addNote = useCommitteeStore((s) => s.addNote);
  const { addToast } = useToast();
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    addNote(delegation, content);
    addToast(`Note added for ${delegation}`);
    setContent("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Note — ${delegation}`}>
      <div className="mb-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          autoFocus
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
          placeholder="Chair notes about this delegate..."
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-background font-semibold rounded-lg transition-colors"
      >
        Add Note
      </button>
    </Modal>
  );
}
