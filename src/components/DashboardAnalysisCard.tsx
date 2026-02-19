"use client";

import { useEffect, useState } from "react";
import { getDashboardAnalysis, runDashboardAnalysis } from "@/lib/actions-ai";
import type { DashboardAnalysisContent } from "@/types/analysis";

interface DashboardAnalysisCardProps {
  onShowToast: (message: string) => void;
}

export function DashboardAnalysisCard({ onShowToast }: DashboardAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<DashboardAnalysisContent | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getDashboardAnalysis().then(({ data }) => setAnalysis(data));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    const { data, error } = await runDashboardAnalysis();
    setRefreshing(false);
    if (error) {
      onShowToast(error);
      return;
    }
    if (data) {
      setAnalysis(data);
      onShowToast("Overview analysis updated.");
    }
  }

  return (
    <div className="rounded-xl border border-bubble-border bg-bubble-surface p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-bubble-muted">Overview analysis</h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-bubble-accent hover:underline disabled:opacity-50"
        >
          {refreshing ? "Analyzing…" : "Refresh analysis"}
        </button>
      </div>
      {!analysis ? (
        <p className="text-sm text-bubble-muted">
          Get recurring patterns and focus areas across all your logs. Click &quot;Refresh analysis&quot;.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Recurring patterns
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.recurring_patterns}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Most common bottleneck stages
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.most_common_bottleneck_stages}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Top focus areas
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.top_focus_areas}</p>
          </div>
        </div>
      )}
    </div>
  );
}
