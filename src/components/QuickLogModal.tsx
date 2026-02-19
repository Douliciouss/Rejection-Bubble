"use client";

import { useState, useEffect } from "react";
import { createEvent, updateEvent, getUserTags, ensureTag, deleteTag } from "@/lib/actions";
import { EVENT_STAGES } from "@/types/database";

interface EventToEdit {
  id: string;
  stage: string;
  happened_at: string;
  note: string | null;
  tagIds?: string[];
}

interface QuickLogModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSaved: () => void;
  /** When set, modal is in edit mode for this event */
  event?: EventToEdit | null;
}

interface TagOption {
  id: string;
  name: string;
}

export function QuickLogModal({ companyId, companyName, onClose, onSaved, event: eventToEdit }: QuickLogModalProps) {
  const isEdit = !!eventToEdit;
  const [stage, setStage] = useState<string>("OA");
  const [happenedAt, setHappenedAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState("");
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserTags().then((tags) => setTagOptions(tags.map((t) => ({ id: t.id, name: t.name }))));
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      setStage(eventToEdit.stage);
      setHappenedAt(
        new Date(eventToEdit.happened_at).toISOString().slice(0, 16)
      );
      setNote(eventToEdit.note ?? "");
      setSelectedTagIds(eventToEdit.tagIds ?? []);
    } else {
      setStage("OA");
      setHappenedAt(new Date().toISOString().slice(0, 16));
      setNote("");
      setSelectedTagIds([]);
    }
  }, [eventToEdit]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function addCustomTag() {
    const name = customTagInput.trim();
    if (!name) return;
    setError(null);
    const result = await ensureTag(name);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (!tagOptions.some((t) => t.id === result.id)) {
      setTagOptions((prev) => [...prev, { id: result.id, name }]);
    }
    setSelectedTagIds((prev) => (prev.includes(result.id) ? prev : [...prev, result.id]));
    setCustomTagInput("");
  }

  async function removeTag(id: string) {
    setTagOptions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTagIds((prev) => prev.filter((x) => x !== id));
    await deleteTag(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const tagIdsStr = selectedTagIds.join(",");
    if (isEdit && eventToEdit) {
      const formData = new FormData();
      formData.set("event_id", eventToEdit.id);
      formData.set("stage", stage);
      formData.set("happened_at", new Date(happenedAt).toISOString());
      formData.set("note", note.trim() || "");
      formData.set("tag_ids", tagIdsStr);
      const result = await updateEvent(formData);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const formData = new FormData();
      formData.set("company_id", companyId);
      formData.set("type", "reject");
      formData.set("stage", stage);
      formData.set("happened_at", new Date(happenedAt).toISOString());
      formData.set("note", note.trim() || "");
      formData.set("tag_ids", tagIdsStr);
      const result = await createEvent(formData);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-bubble-surface border border-bubble-border p-6 shadow-xl"
        role="dialog"
        aria-labelledby="quick-log-title"
      >
        <h2 id="quick-log-title" className="text-lg font-semibold mb-1">
          {isEdit ? "Edit log" : "Quick Log"}
        </h2>
        <p className="text-sm text-bubble-muted mb-4">{companyName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="stage" className="block text-sm font-medium mb-1">
              Stage
            </label>
            <select
              id="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            >
              {EVENT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="happened_at" className="block text-sm font-medium mb-1">
              Date / time
            </label>
            <input
              id="happened_at"
              type="datetime-local"
              value={happenedAt}
              onChange={(e) => setHappenedAt(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Applied position</span>
            <div className="flex flex-wrap gap-2 mb-2">
              {tagOptions.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-bubble-border bg-bubble-bg px-2 py-1 text-sm"
                >
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="rounded border-bubble-border text-bubble-accent focus:ring-bubble-accent"
                    />
                    <span>{t.name}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTag(t.id)}
                    className="text-bubble-muted hover:text-bubble-danger p-0.5 rounded"
                    aria-label={`Remove ${t.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add position (e.g. Backend, Frontend)"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                className="flex-1 px-3 py-2 rounded-lg bg-bubble-bg border border-bubble-border text-sm placeholder:text-bubble-muted focus:border-bubble-accent outline-none"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-2 rounded-lg border border-bubble-border hover:bg-bubble-border text-sm"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              id="note"
              rows={8}
              placeholder="Interview details, what went well, what to improve, reflections…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none resize-y min-h-[160px]"
            />
          </div>

          {error && <p className="text-sm text-bubble-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-bubble-border hover:bg-bubble-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
