"use client";

import React, { useState, useRef } from "react";
import { useCommitteeStore, downloadBackup, importBackup } from "@/store/committeeStore";
import { undo } from "@/store/committeeStore";
import { useChairStore } from "@/store/chairStore";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export";
import { Settings, Download, Upload, Undo2, Trash2, FileSpreadsheet, FileText, FileDown, AlertTriangle, Users, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const committeeInfo = useCommitteeStore((s) => s.committeeInfo);
  const setCommitteeInfo = useCommitteeStore((s) => s.setCommitteeInfo);
  const resetAll = useCommitteeStore((s) => s.resetAll);

  const chairs = useChairStore((s) => s.chairs);
  const activeChairId = useChairStore((s) => s.activeChairId);
  const addChair = useChairStore((s) => s.addChair);
  const removeChair = useChairStore((s) => s.removeChair);
  const renameChair = useChairStore((s) => s.renameChair);
  const { addToast } = useToast();

  const [committeeName, setCommitteeName] = useState(committeeInfo.name);
  const [committeeTopic, setCommitteeTopic] = useState(committeeInfo.topic);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newChairName, setNewChairName] = useState("");
  const [confirmDeleteChair, setConfirmDeleteChair] = useState<string | null>(null);
  const [editingChair, setEditingChair] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveInfo = () => {
    setCommitteeInfo(committeeName, committeeTopic);
    addToast("Committee info saved");
  };

  const handleUndo = () => {
    const success = undo();
    if (success) {
      addToast("Last action undone", "info");
    } else {
      addToast("Nothing to undo", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importBackup(file);
    if (success) {
      addToast("Backup restored successfully");
    } else {
      addToast("Invalid backup file", "error");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    resetAll();
    setShowResetConfirm(false);
    addToast("All data has been reset", "info");
  };

  const handleAddChair = () => {
    const trimmed = newChairName.trim();
    if (!trimmed) return;
    addChair(trimmed);
    setNewChairName("");
    addToast(`Chair "${trimmed}" created`);
  };

  const handleDeleteChair = (id: string) => {
    const chair = chairs.find((c) => c.id === id);
    removeChair(id);
    setConfirmDeleteChair(null);
    addToast(`Chair "${chair?.name}" removed`, "info");
  };

  const handleRenameChair = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    renameChair(id, trimmed);
    setEditingChair(null);
    setEditName("");
    addToast("Chair renamed");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Settings size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted">Export data, manage backups, chairs, and committee</p>
        </div>
      </div>

      {/* Chair Management */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={18} className="text-accent" /> Chair Management
        </h2>
        <p className="text-sm text-muted mb-4">
          Each chair maintains independent scores. Add chairs here or from the login screen.
        </p>

        {/* Chair list */}
        <div className="space-y-2 mb-4">
          {chairs.map((chair) => (
            <div
              key={chair.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                chair.id === activeChairId
                  ? "bg-accent/10 border-accent/30"
                  : "bg-surface border-border/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xs">
                    {chair.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {editingChair === chair.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameChair(chair.id)}
                      className="px-2 py-1 bg-surface border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameChair(chair.id)}
                      className="text-xs text-accent font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChair(null)}
                      className="text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-foreground">{chair.name}</span>
                    {chair.id === activeChairId && (
                      <span className="badge bg-accent/20 text-accent ml-2 text-[10px]">Active</span>
                    )}
                    <p className="text-[10px] text-muted">
                      Created {new Date(chair.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingChair !== chair.id && (
                  <button
                    onClick={() => {
                      setEditingChair(chair.id);
                      setEditName(chair.name);
                    }}
                    className="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Rename
                  </button>
                )}
                {chair.id !== activeChairId && (
                  confirmDeleteChair === chair.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteChair(chair.id)}
                        className="px-2 py-1 bg-danger text-white text-xs rounded font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteChair(null)}
                        className="px-2 py-1 text-xs text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteChair(chair.id)}
                      className="p-1 text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new chair */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newChairName}
            onChange={(e) => setNewChairName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChair()}
            placeholder="New chair name..."
            className="flex-1 px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleAddChair}
            disabled={!newChairName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Committee Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Committee Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-light mb-1">Committee Name</label>
            <input
              value={committeeName}
              onChange={(e) => setCommitteeName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
              placeholder="e.g. CAC Summit II"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-light mb-1">Topic</label>
            <input
              value={committeeTopic}
              onChange={(e) => setCommitteeTopic(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
              placeholder="e.g. The Future of Multilateral Diplomacy"
            />
          </div>
          <button
            onClick={handleSaveInfo}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Export Data</h2>
        <p className="text-sm text-muted mb-4">
          Download all rankings, scores, speech records, POI records, directive records, and chair notes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => { exportCSV(delegations); addToast("CSV exported"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <FileText size={18} className="text-success" />
            Export CSV
          </button>
          <button
            onClick={async () => { await exportExcel(delegations); addToast("Excel exported"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <FileSpreadsheet size={18} className="text-info" />
            Export Excel
          </button>
          <button
            onClick={async () => { await exportPDF(delegations); addToast("PDF exported"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <FileDown size={18} className="text-danger" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Backup / Restore */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Backup & Restore</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => { downloadBackup(); addToast("Backup downloaded"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Download size={18} className="text-accent" />
            Download Backup (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Upload size={18} className="text-info" />
            Restore from Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Undo */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border/30 rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Undo2 size={18} className="text-warning" />
            Undo Last Action
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="glass-card p-6 border border-danger/20">
        <h2 className="text-lg font-semibold mb-2 text-danger flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        <p className="text-sm text-muted mb-4">
          This will permanently delete all scores, speeches, directives, notes, and timeline data for the current chair.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/30 rounded-lg text-sm font-medium text-danger hover:bg-danger/20 transition-all"
          >
            <Trash2 size={16} />
            Reset All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
