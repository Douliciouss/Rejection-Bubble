/**
 * Structured AI analysis output types.
 * All analyses are evidence-based, note missing data when absent, and include actionable next steps.
 */

/** Shared block: diagnosis + plan + reflection */
export interface DiagnosisBlock {
  /** What likely went wrong and why (with evidence from notes) */
  diagnosis: string;
  /** Concrete improvement plan; clear next steps */
  improvement_plan: string;
  /** Warm, supportive reflection; still actionable */
  reflection: string;
}

/** Company-level analysis */
export interface CompanyAnalysisContent {
  /** Recurring themes / bottlenecks for this company */
  themes_bottlenecks: string;
  /** Likely failure reasons (evidence from logs) */
  likely_failure_reasons: string;
  /** Targeted action plan for next attempt at this company */
  action_plan: string;
  /** Optional short diagnosis + reflection (can reuse DiagnosisBlock shape) */
  diagnosis?: string;
  reflection?: string;
}

/** Dashboard-level analysis */
export interface DashboardAnalysisContent {
  /** Recurring patterns across all companies */
  recurring_patterns: string;
  /** Most common bottleneck stages */
  most_common_bottleneck_stages: string;
  /** Top 1–3 focus areas */
  top_focus_areas: string;
}

/** Weekly analysis */
export interface WeeklyAnalysisContent {
  /** What happened this week (summary) */
  what_happened: string;
  /** What improved / got worse */
  what_improved_or_worsened: string;
  /** 3 concrete tasks for next week */
  three_tasks: string[];
}

export type CompanyAnalysisStored = CompanyAnalysisContent;
export type DashboardAnalysisStored = DashboardAnalysisContent;
export type WeeklyAnalysisStored = WeeklyAnalysisContent;
