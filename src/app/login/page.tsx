"use client";

import React, { useState } from "react";
import { useChairStore } from "@/store/chairStore";
import { migrateOldStore } from "@/store/committeeStore";
import { useRouter } from "next/navigation";
import { UserPlus, LogIn, Users, Trash2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const chairs = useChairStore((s) => s.chairs);
  const addChair = useChairStore((s) => s.addChair);
  const removeChair = useChairStore((s) => s.removeChair);
  const setActiveChair = useChairStore((s) => s.setActiveChair);

  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Run migration on first render
  React.useEffect(() => {
    migrateOldStore();
  }, []);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const chair = addChair(trimmed);
    setActiveChair(chair.id);
    setNewName("");
    router.push("/");
  };

  const handleSelect = (id: string) => {
    setActiveChair(id);
    router.push("/");
  };

  const handleDelete = (id: string) => {
    removeChair(id);
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Logo / Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border/30 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            MUN Committee Scorer
          </h1>
          <p className="text-muted mt-2 text-sm">
            CAC Summit II · Select or create a chair to begin
          </p>
        </div>

        {/* Existing Chairs */}
        {chairs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs text-muted uppercase tracking-wider font-semibold px-1">
              Select Chair
            </h2>
            <div className="space-y-2">
              {chairs.map((chair) => (
                <div
                  key={chair.id}
                  className="glass-card glass-card-hover flex items-center justify-between p-4 cursor-pointer group"
                  onClick={() => handleSelect(chair.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <span className="text-accent font-bold text-sm">
                        {chair.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {chair.name}
                      </span>
                      <p className="text-xs text-muted">
                        Created {new Date(chair.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmDelete === chair.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(chair.id)}
                          className="px-2.5 py-1 bg-danger text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(chair.id);
                          }}
                          className="p-1.5 text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete chair"
                        >
                          <Trash2 size={14} />
                        </button>
                        <LogIn size={18} className="text-muted group-hover:text-accent transition-colors" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Chair */}
        <div className="space-y-2">
          <h2 className="text-xs text-muted uppercase tracking-wider font-semibold px-1">
            {chairs.length > 0 ? "Or Create New Chair" : "Create a Chair"}
          </h2>
          <div className="glass-card p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Enter chair name..."
                className="flex-1 px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                autoFocus={chairs.length === 0}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} />
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/60">
          Each chair maintains independent scores · Data is stored locally
        </p>
      </div>
    </div>
  );
}
