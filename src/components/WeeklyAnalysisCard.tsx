"use client";

import { useEffect, useState } from "react";
import { getWeeklyAnalysis, runWeeklyAnalysis } from "@/lib/actions-ai";
import type { WeeklyAnalysisContent } from "@/types/analysis";

interface WeeklyAnalysisCardProps {
  onShowToast: (message: string) => void;
}

export function WeeklyAnalysisCard({ onShowToast }: WeeklyAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<WeeklyAnalysisContent | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getWeeklyAnalysis().then(({ data }) => setAnalysis(data));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    const { data, error } = await runWeeklyAnalysis();
    setRefreshing(false);
    if (error) {
      onShowToast(error);
      return;
    }
    if (data) {
      setAnalysis(data);
      onShowToast("Weekly review updated.");
    }
  }

  return (
    <div className="rounded-xl border border-bubble-border bg-bubble-surface p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-bubble-muted">Weekly review</h3>
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
          Get a summary of the last 7 days and 3 concrete tasks for next week. Click &quot;Refresh analysis&quot;.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              What happened this week
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.what_happened}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              What improved or got worse
            </h4>
            <p className="text-zinc-300 whitespace-pre-wrap">{analysis.what_improved_or_worsened}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-bubble-muted uppercase tracking-wider mb-1">
              3 tasks for next week
            </h4>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {(analysis.three_tasks ?? []).map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
