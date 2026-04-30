"use client";

import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/constants";
import { createMeetingAction } from "@/app/actions";

export function NewMeetingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category || !transcript.trim()) return;
    
    setSaving(true);
    setError(null);
    try {
      const res = await createMeetingAction({
        name,
        category: category as Category,
        transcript,
        date: new Date().toISOString().split("T")[0],
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to create meeting.");
        return;
      }
      setIsOpen(false);
      setName("");
      setCategory("");
      setTranscript("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        New Meeting
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-medium tracking-tight">Upload New Transcript</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Meeting Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp Q3 Review"
                    className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Category</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="" disabled>Select a category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Transcript</label>
                  <textarea
                    required
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste the raw transcript here..."
                    rows={6}
                    className="w-full resize-none rounded-md border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !category || !transcript.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {saving ? "Saving..." : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
