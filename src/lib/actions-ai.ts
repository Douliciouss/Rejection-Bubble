"use server";

import { createClient } from "@/lib/supabase/server";
import { chat } from "@/lib/openrouter";
import type {
  CompanyAnalysisContent,
  DashboardAnalysisContent,
  WeeklyAnalysisContent,
} from "@/types/analysis";
import { revalidatePath } from "next/cache";

const SYSTEM_RULES = `You are a supportive career coach analyzing a job seeker's rejection logs. Be evidence-based: tie conclusions to specific notes. If data is missing, say so explicitly (e.g. "No notes for this stage"). Give concrete, actionable next steps—no generic advice. Output valid JSON only, no markdown or extra text.`;

function extractJson<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const str = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

async function getCompanyLogsPayload(companyId: string): Promise<{ companyName: string; payload: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single();
  if (!company) return null;
  const { data: events } = await supabase
    .from("events")
    .select("type, stage, happened_at, note")
    .eq("company_id", companyId)
    .order("happened_at", { ascending: false });
  if (!events?.length) return { companyName: company.name, payload: "No logs yet for this company." };
  const lines = events.map(
    (e) =>
      `- ${e.happened_at} | ${e.type} | ${e.stage}${e.note ? ` | Note: ${e.note}` : ""}`
  );
  return { companyName: company.name, payload: lines.join("\n") };
}

async function getDashboardPayload(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data: events } = await supabase
    .from("events")
    .select("company_id, type, stage, happened_at, note")
    .eq("user_id", user.id)
    .order("happened_at", { ascending: false });
  if (!events?.length) return "No logs yet.";
  const companyIds = [...new Set(events.map((e) => e.company_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds);
  const nameById = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const byCompany = new Map<string, string[]>();
  for (const e of events) {
    const name = nameById.get(e.company_id) ?? "Unknown";
    const arr = byCompany.get(name) ?? [];
    arr.push(`${e.type} | ${e.stage} | ${e.happened_at}${e.note ? ` | ${e.note}` : ""}`);
    byCompany.set(name, arr);
  }
  const parts: string[] = [];
  byCompany.forEach((logs, name) => {
    parts.push(`Company: ${name}\n${logs.join("\n")}`);
  });
  return parts.join("\n\n");
}

async function getWeeklyPayload(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: events } = await supabase
    .from("events")
    .select("company_id, type, stage, happened_at, note")
    .eq("user_id", user.id)
    .gte("happened_at", weekAgo.toISOString())
    .order("happened_at", { ascending: false });
  if (!events?.length) return "No activity in the last 7 days.";
  const companyIds = [...new Set(events.map((e) => e.company_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds);
  const nameById = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const lines = events.map(
    (e) =>
      `- ${nameById.get(e.company_id) ?? "?"} | ${e.type} | ${e.stage} | ${e.happened_at}${e.note ? ` | ${e.note}` : ""}`
  );
  return lines.join("\n");
}

const COMPANY_JSON_SCHEMA = `{
  "themes_bottlenecks": "string: recurring themes or bottlenecks at this company",
  "likely_failure_reasons": "string: evidence-based hypotheses; say what's missing if no notes",
  "action_plan": "string: targeted next steps for this company"
}`;

const DASHBOARD_JSON_SCHEMA = `{
  "recurring_patterns": "string: patterns across all companies",
  "most_common_bottleneck_stages": "string: where rejections cluster",
  "top_focus_areas": "string: 1-3 concrete focus areas"
}`;

const WEEKLY_JSON_SCHEMA = `{
  "what_happened": "string: summary of this week",
  "what_improved_or_worsened": "string: what got better or worse",
  "three_tasks": ["task1", "task2", "task3"]
}`;

export async function getCompanyAnalysis(
  companyId: string
): Promise<{ data: CompanyAnalysisContent | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data } = await supabase
    .from("company_analyses")
    .select("content, model_used, created_at")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: (data?.content as CompanyAnalysisContent) ?? null, error: null };
}

export async function runCompanyAnalysis(
  companyId: string
): Promise<{ data: CompanyAnalysisContent | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const payload = await getCompanyLogsPayload(companyId);
  if (!payload) return { data: null, error: "Company not found" };

  const result = await chat(
    [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: `Analyze this job rejection log for the company "${payload.companyName}". Provide a rational diagnosis, targeted action plan, and be evidence-based. If there are no or few notes, say what's missing.\n\nLogs:\n${payload.payload}\n\nRespond with only this JSON:\n${COMPANY_JSON_SCHEMA}`,
      },
    ]
  );

  if (!result.success) return { data: null, error: result.error ?? "Analysis failed" };
  const parsed = extractJson<CompanyAnalysisContent>(result.content);
  if (!parsed || !parsed.themes_bottlenecks || !parsed.likely_failure_reasons || !parsed.action_plan) {
    return { data: null, error: "Invalid analysis response" };
  }

  await supabase.from("company_analyses").insert({
    user_id: user.id,
    company_id: companyId,
    content: parsed,
    model_used: result.model ?? undefined,
  });
  revalidatePath("/dashboard");
  return { data: parsed, error: null };
}

export async function getDashboardAnalysis(): Promise<{
  data: DashboardAnalysisContent | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data } = await supabase
    .from("dashboard_analyses")
    .select("content, model_used, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: (data?.content as DashboardAnalysisContent) ?? null, error: null };
}

export async function runDashboardAnalysis(): Promise<{
  data: DashboardAnalysisContent | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const payload = await getDashboardPayload();
  const result = await chat(
    [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: `Analyze this job seeker's rejection logs across ALL companies. Find recurring patterns, most common bottleneck stages, and the top 1-3 focus areas. Be evidence-based and actionable.\n\nLogs (by company):\n${payload}\n\nRespond with only this JSON:\n${DASHBOARD_JSON_SCHEMA}`,
      },
    ]
  );

  if (!result.success) return { data: null, error: result.error ?? "Analysis failed" };
  const parsed = extractJson<DashboardAnalysisContent>(result.content);
  if (
    !parsed ||
    !parsed.recurring_patterns ||
    !parsed.most_common_bottleneck_stages ||
    !parsed.top_focus_areas
  ) {
    return { data: null, error: "Invalid analysis response" };
  }

  await supabase.from("dashboard_analyses").insert({
    user_id: user.id,
    content: parsed,
    model_used: result.model ?? undefined,
  });
  revalidatePath("/dashboard");
  return { data: parsed, error: null };
}

export async function getWeeklyAnalysis(): Promise<{
  data: WeeklyAnalysisContent | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const startOfWeek = getStartOfWeek(new Date());
  const { data } = await supabase
    .from("weekly_analyses")
    .select("content, model_used, created_at")
    .eq("user_id", user.id)
    .eq("week_start", startOfWeek)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: (data?.content as WeeklyAnalysisContent) ?? null, error: null };
}

function getStartOfWeek(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function runWeeklyAnalysis(): Promise<{
  data: WeeklyAnalysisContent | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const payload = await getWeeklyPayload();
  const result = await chat(
    [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: `Review this job seeker's activity in the last 7 days. Summarize what happened, what improved or got worse, and give exactly 3 concrete tasks for next week. Be warm and actionable.\n\nActivity:\n${payload}\n\nRespond with only this JSON:\n${WEEKLY_JSON_SCHEMA}`,
      },
    ]
  );

  if (!result.success) return { data: null, error: result.error ?? "Analysis failed" };
  const parsed = extractJson<WeeklyAnalysisContent>(result.content);
  if (
    !parsed ||
    !parsed.what_happened ||
    !parsed.what_improved_or_worsened ||
    !Array.isArray(parsed.three_tasks)
  ) {
    return { data: null, error: "Invalid analysis response" };
  }

  const weekStart = getStartOfWeek(new Date());
  await supabase.from("weekly_analyses").insert({
    user_id: user.id,
    content: parsed,
    model_used: result.model ?? undefined,
    week_start: weekStart,
  });
  revalidatePath("/dashboard");
  return { data: parsed, error: null };
}
