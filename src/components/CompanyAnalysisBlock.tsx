"use client";

import { useEffect, useState } from "react";
import { getCompanyAnalysis, runCompanyAnalysis } from "@/lib/actions-ai";
import type { CompanyAnalysisContent } from "@/types/analysis";

interface CompanyAnalysisBlockProps {
  companyId: string;
  onShowToast: (message: string) => void;
}

export function CompanyAnalysisBlock({ companyId, onShowToast }: CompanyAnalysisBlockProps) {
  const [analysis, setAnalysis] = useState<CompanyAnalysisContent | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCompanyAnalysis(companyId).then(({ data }) => {
      if (!cancelled) setAnalysis(data);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function handleRefresh() {
    setRefreshing(true);
    const { data, error } = await runCompanyAnalysis(companyId);
    setRefreshing(false);
    if (error) {
      onShowToast(error);
      return;
    }
    if (data) {
      setAnalysis(data);
      onShowToast("Analysis updated.");
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-bubble-border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-bubble-muted">AI Analysis</h3>
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
          Click &quot;Refresh analysis&quot; to get evidence-based insights and a targeted action plan from your logs.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Themes & bottlenecks
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.themes_bottlenecks}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Likely failure reasons
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.likely_failure_reasons}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              Action plan
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.action_plan}</p>
          </div>
        </div>
      )}
    </div>
  );
}
