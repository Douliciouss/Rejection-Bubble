"use client";

import { useMemo, useState } from "react";
import type { EventStage, EventType } from "@/types/database";
import { QuickLogModal } from "./QuickLogModal";
import { EditCompanyModal } from "./EditCompanyModal";
import { CompanyAnalysisBlock } from "./CompanyAnalysisBlock";
import { deleteEvent } from "@/lib/actions";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  company_url: string | null;
}

interface EventTag {
  id: string;
  name: string;
}

interface EventRow {
  id: string;
  type: EventType;
  stage: EventStage;
  happened_at: string;
  rejected_at: string | null;
  note: string | null;
  created_at: string;
  tags?: EventTag[];
}

interface CompanyDrawerProps {
  companyId: string | null;
  onClose: () => void;
  company: Company | null;
  events: EventRow[];
  onEventAdded: () => void;
  onEventDeleted: () => void;
  onCompanyUpdated: () => void;
  onShowToast: (message: string) => void;
}

export type EventRowEdit = Pick<EventRow, "id" | "stage" | "happened_at" | "note"> & { tagIds?: string[] };

const typeLabel: Record<EventType, string> = {
  reject: "Rejection",
  interview: "Interview",
  later_applied: "Later applied",
  offer: "Offer",
  ghost: "Ghosted",
};

function eventMatchesSearch(ev: EventRow, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const noteMatch = (ev.note ?? "").toLowerCase().includes(lower);
  const tagMatch = (ev.tags ?? []).some((t) => t.name.toLowerCase().includes(lower));
  return noteMatch || tagMatch;
}

export function CompanyDrawer({
  companyId,
  onClose,
  company,
  events,
  onEventAdded,
  onEventDeleted,
  onCompanyUpdated,
  onShowToast,
}: CompanyDrawerProps) {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRowEdit | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () => events.filter((ev) => eventMatchesSearch(ev, logSearch)),
    [events, logSearch]
  );

  const openAddLog = () => {
    setEditingEvent(null);
    setShowQuickLog(true);
  };
  const openEditLog = (ev: EventRow) => {
    setEditingEvent({
      id: ev.id,
      stage: ev.stage,
      happened_at: ev.happened_at,
      note: ev.note,
      tagIds: ev.tags?.map((t) => t.id),
    });
    setShowQuickLog(true);
  };
  const closeLogModal = () => {
    setShowQuickLog(false);
    setEditingEvent(null);
  };

  async function handleDelete(ev: EventRow) {
    if (!confirm("Delete this log? This cannot be undone.")) return;
    setDeletingId(ev.id);
    const result = await deleteEvent(ev.id);
    setDeletingId(null);
    if (result.error) {
      onShowToast(result.error);
      return;
    }
    onEventDeleted();
  }

  if (!companyId) return null;

  const openCareers = () => {
    if (company?.company_url) window.open(company.company_url, "_blank");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-30 w-full max-w-md h-full bg-bubble-surface border-l border-bubble-border flex flex-col shadow-xl"
        role="dialog"
        aria-label="Company details"
      >
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-bubble-border">
          <div className="flex items-center gap-3 min-w-0">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-bubble-border shrink-0 flex items-center justify-center text-bubble-muted text-sm font-medium">
                {company?.name?.slice(0, 2).toUpperCase() ?? "—"}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{company?.name ?? "Company"}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {company?.company_url && (
                  <button
                    type="button"
                    onClick={openCareers}
                    className="text-sm text-bubble-accent hover:underline"
                  >
                    Open careers page
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEditCompany(true)}
                  className="text-sm text-bubble-muted hover:text-bubble-accent"
                >
                  Edit company
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-bubble-muted hover:bg-bubble-border hover:text-zinc-100 transition-colors"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex justify-between items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-bubble-muted">Timeline</h3>
            <button
              type="button"
              onClick={openAddLog}
              className="px-4 py-2 rounded-lg bg-bubble-accent text-bubble-bg text-sm font-medium hover:opacity-90 shrink-0"
            >
              Add log
            </button>
          </div>
          <input
            type="search"
            placeholder="Search notes and applied positions…"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bubble-bg border border-bubble-border text-sm placeholder:text-bubble-muted focus:border-bubble-accent outline-none mb-4"
          />

          {filteredEvents.length === 0 ? (
            <p className="text-sm text-bubble-muted">
              {events.length === 0
                ? "No events yet. Add a rejection or interview."
                : "No logs match your search."}
            </p>
          ) : null}
          {filteredEvents.length > 0 ? (
            <ul className="space-y-3">
              {filteredEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="p-3 rounded-lg bg-bubble-bg border border-bubble-border"
                >
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">{typeLabel[ev.type]}</span>
                    <span className="text-xs text-bubble-muted shrink-0">
                      {new Date(ev.happened_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditLog(ev)}
                        className="text-xs text-bubble-accent hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-bubble-border" aria-hidden>|</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev)}
                        disabled={deletingId === ev.id}
                        className="text-xs text-bubble-danger hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-bubble-muted mt-0.5">
                    Stage: {ev.stage}
                  </div>
                  {(ev.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(ev.tags ?? []).map((t) => (
                        <span
                          key={t.id}
                          className="inline-block px-2 py-0.5 rounded text-xs bg-bubble-border text-bubble-muted"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {ev.note && (
                    <p className="text-sm mt-2 text-zinc-300 whitespace-pre-wrap">{ev.note}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <CompanyAnalysisBlock companyId={companyId} onShowToast={onShowToast} />
        </div>
      </aside>

      {showQuickLog && (
        <QuickLogModal
          companyId={companyId}
          companyName={company?.name ?? ""}
          onClose={closeLogModal}
          onSaved={() => {
            closeLogModal();
            onEventAdded();
          }}
          event={
            editingEvent
              ? {
                  id: editingEvent.id,
                  stage: editingEvent.stage,
                  happened_at: editingEvent.happened_at,
                  note: editingEvent.note,
                  tagIds: editingEvent.tagIds,
                }
              : undefined
          }
        />
      )}

      {showEditCompany && company && (
        <EditCompanyModal
          companyId={company.id}
          name={company.name}
          companyUrl={company.company_url}
          logoUrl={company.logo_url}
          onClose={() => setShowEditCompany(false)}
          onSaved={() => {
            onCompanyUpdated();
            onShowToast("Company updated.");
          }}
        />
      )}
    </>
  );
}
