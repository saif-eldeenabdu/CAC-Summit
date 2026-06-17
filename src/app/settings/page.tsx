"use client";

import React, { useState, useRef } from "react";
import { useCommitteeStore, downloadBackup, importBackup } from "@/store/committeeStore";
import { undo } from "@/store/committeeStore";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export";
import { Settings, Download, Upload, Undo2, Trash2, FileSpreadsheet, FileText, FileDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const delegations = useCommitteeStore((s) => s.delegations);
  const committeeInfo = useCommitteeStore((s) => s.committeeInfo);
  const setCommitteeInfo = useCommitteeStore((s) => s.setCommitteeInfo);
  const resetAll = useCommitteeStore((s) => s.resetAll);
  const { addToast } = useToast();

  const [committeeName, setCommitteeName] = useState(committeeInfo.name);
  const [committeeTopic, setCommitteeTopic] = useState(committeeInfo.topic);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Settings size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted">Export data, manage backups, and configure committee</p>
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
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
              placeholder="e.g. CAC Summit II"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-light mb-1">Topic</label>
            <input
              value={committeeTopic}
              onChange={(e) => setCommitteeTopic(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <FileText size={18} className="text-success" />
            Export CSV
          </button>
          <button
            onClick={async () => { await exportExcel(delegations); addToast("Excel exported"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <FileSpreadsheet size={18} className="text-info" />
            Export Excel
          </button>
          <button
            onClick={async () => { await exportPDF(delegations); addToast("PDF exported"); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Download size={18} className="text-accent" />
            Download Backup (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
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
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
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
          This will permanently delete all scores, speeches, directives, notes, and timeline data.
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
