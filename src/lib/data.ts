import { createClient } from "@/lib/supabase/server";
import type { BubbleInput } from "@/types/database";

export async function getBubbleCompanies(): Promise<BubbleInput[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("bubble_companies")
    .select("id, name, rejections, logo_url, company_url")
    .order("rejections", { ascending: false });

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    rejections: row.rejections ?? 0,
    logo: row.logo_url,
    url: row.company_url,
  }));
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getEventsForCompany(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("events")
    .select("id, type, stage, happened_at, rejected_at, note, created_at")
    .eq("company_id", companyId)
    .order("happened_at", { ascending: false });
  return data ?? [];
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { totalCompanies: 0, totalRejections: 0, last30Days: 0 };

  const [companiesRes, eventsRes, last30Res] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("type", "reject"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "reject")
      .gte("happened_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalCompanies: companiesRes.count ?? 0,
    totalRejections: eventsRes.count ?? 0,
    last30Days: last30Res.count ?? 0,
  };
}
