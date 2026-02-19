"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BubbleField } from "./BubbleField";
import { CompanyDrawer } from "./CompanyDrawer";
import { CreateCompanyModal } from "./CreateCompanyModal";
import { Toast } from "./Toast";
import { DashboardAnalysisCard } from "./DashboardAnalysisCard";
import { WeeklyAnalysisCard } from "./WeeklyAnalysisCard";
import { getCompanyWithEvents } from "@/lib/actions";
import type { BubbleInput, EventStage, EventType } from "@/types/database";

interface DashboardClientProps {
  bubbleCompanies: BubbleInput[];
  stats: { totalCompanies: number; totalRejections: number; last30Days: number };
}

export function DashboardClient({ bubbleCompanies, stats }: DashboardClientProps) {
  const router = useRouter();
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [drawerData, setDrawerData] = useState<{
    company: { id: string; name: string; logo_url: string | null; company_url: string | null } | null;
    events: Array<{
      id: string;
      type: EventType;
      stage: EventStage;
      happened_at: string;
      rejected_at: string | null;
      note: string | null;
      created_at: string;
      tags?: { id: string; name: string }[];
    }>;
  } | null>(null);

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return bubbleCompanies;
    const q = companySearch.trim().toLowerCase();
    return bubbleCompanies.filter((c) => c.name.toLowerCase().includes(q));
  }, [bubbleCompanies, companySearch]);

  const openDrawer = useCallback(async (companyId: string) => {
    setSelectedCompanyId(companyId);
    const { company, events } = await getCompanyWithEvents(companyId);
    setDrawerData({
      company: company
        ? {
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
            company_url: company.company_url,
          }
        : null,
      events,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedCompanyId(null);
    setDrawerData(null);
  }, []);

  const refreshDrawer = useCallback(async () => {
    if (!selectedCompanyId) return;
    const { company, events } = await getCompanyWithEvents(selectedCompanyId);
    setDrawerData({
      company: company
        ? {
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
            company_url: company.company_url,
          }
        : null,
      events,
    });
  }, [selectedCompanyId]);

  const showToast = useCallback((message: string) => {
    setToast({ message });
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-6 py-4 border-b border-bubble-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-bubble-muted">Companies</span>
            <span className="font-semibold">{stats.totalCompanies}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bubble-muted">Rejections</span>
            <span className="font-semibold">{stats.totalRejections}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bubble-muted">Last 30 days</span>
            <span className="font-semibold">{stats.last30Days}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search companies…"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="w-48 px-3 py-2 rounded-lg bg-bubble-surface border border-bubble-border text-sm placeholder:text-bubble-muted focus:border-bubble-accent outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCreateCompany(true)}
            className="px-4 py-2 rounded-lg bg-bubble-accent text-bubble-bg text-sm font-medium hover:opacity-90"
          >
            Add company
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-6 flex flex-col overflow-y-auto">
        <p className="text-xs text-bubble-muted mb-2">Click a bubble or a company in the list to open details.</p>
        <div className="flex-1 min-h-0 rounded-xl border border-bubble-border bg-bubble-surface overflow-hidden">
          <BubbleField
            companies={filteredCompanies}
            topN={5}
            onCompanyClick={openDrawer}
            highlightedId={highlightedId}
            onHighlightChange={setHighlightedId}
          />
        </div>
        <DashboardAnalysisCard onShowToast={showToast} />
        <WeeklyAnalysisCard onShowToast={showToast} />
      </div>

      {selectedCompanyId && (
        <CompanyDrawer
          companyId={selectedCompanyId}
          onClose={closeDrawer}
          company={drawerData?.company ?? null}
          events={drawerData?.events ?? []}
          onEventAdded={() => {
            refreshDrawer();
            showToast("Saved. Thanks for logging.");
          }}
          onEventDeleted={() => {
            refreshDrawer();
            showToast("Log deleted.");
          }}
          onCompanyUpdated={refreshDrawer}
          onShowToast={showToast}
        />
      )}

      <Toast
        message={toast?.message ?? ""}
        visible={!!toast}
        onDismiss={() => setToast(null)}
      />

      {showCreateCompany && (
        <CreateCompanyModal
          onClose={() => setShowCreateCompany(false)}
          onCreated={() => router.refresh()}
        />
      )}
    </div>
  );
}
