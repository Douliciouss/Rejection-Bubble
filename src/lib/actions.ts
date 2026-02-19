"use server";

import { createClient } from "@/lib/supabase/server";
import type { EventStage, EventType } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const company_url = (formData.get("company_url") as string)?.trim() || null;
  const logo_url = (formData.get("logo_url") as string)?.trim() || null;

  if (!name) return { error: "Company name is required" };

  const { error } = await supabase.from("companies").insert({
    user_id: user.id,
    name,
    company_url: company_url || null,
    logo_url: logo_url || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const company_id = formData.get("company_id") as string;
  const type = (formData.get("type") as EventType) || "reject";
  const stage = formData.get("stage") as EventStage;
  const happened_at = formData.get("happened_at") as string;
  const note = (formData.get("note") as string)?.trim() || null;
  const tagIdsStr = (formData.get("tag_ids") as string) || "";
  const tag_ids = tagIdsStr ? tagIdsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!company_id || !stage || !happened_at)
    return { error: "Company, stage, and date are required" };

  const { data: inserted, error } = await supabase.from("events").insert({
    user_id: user.id,
    company_id,
    type,
    stage,
    happened_at: new Date(happened_at).toISOString(),
    note,
  }).select("id").single();

  if (error) return { error: error.message };
  if (inserted && tag_ids.length > 0) {
    await supabase.from("event_tags").insert(
      tag_ids.map((tag_id) => ({ event_id: inserted.id, tag_id }))
    );
  }
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const eventId = formData.get("event_id") as string;
  const stage = formData.get("stage") as EventStage;
  const happened_at = formData.get("happened_at") as string;
  const note = (formData.get("note") as string)?.trim() || null;
  const tagIdsStr = (formData.get("tag_ids") as string) || "";
  const tag_ids = tagIdsStr ? tagIdsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!eventId || !stage || !happened_at)
    return { error: "Event id, stage, and date are required" };

  const { error } = await supabase
    .from("events")
    .update({
      stage,
      happened_at: new Date(happened_at).toISOString(),
      note,
    })
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  await supabase.from("event_tags").delete().eq("event_id", eventId);
  if (tag_ids.length > 0) {
    await supabase.from("event_tags").insert(
      tag_ids.map((tag_id) => ({ event_id: eventId, tag_id }))
    );
  }
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const companyId = formData.get("company_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const company_url = (formData.get("company_url") as string)?.trim() || null;
  const logo_url = (formData.get("logo_url") as string)?.trim() || null;
  if (!companyId) return { error: "Company id is required" };
  if (!name) return { error: "Company name is required" };
  const { error } = await supabase
    .from("companies")
    .update({ name, company_url, logo_url })
    .eq("id", companyId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getUserTags(): Promise<{ id: string; name: string; color: string | null }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("tags").select("id, name, color").eq("user_id", user.id).order("name");
  return data ?? [];
}

export async function ensureTag(name: string): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Position name is required" };
  const { data: existing } = await supabase.from("tags").select("id").eq("user_id", user.id).ilike("name", trimmed).maybeSingle();
  if (existing) return { id: existing.id };
  const { data: inserted, error } = await supabase.from("tags").insert({ user_id: user.id, name: trimmed }).select("id").single();
  if (error) return { error: error.message };
  return { id: inserted.id };
}

export async function deleteTag(tagId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("tags").delete().eq("id", tagId).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getCompanyWithEvents(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { company: null, events: [] };

  const [companyRes, eventsRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).single(),
    supabase
      .from("events")
      .select("id, type, stage, happened_at, rejected_at, note, created_at")
      .eq("company_id", companyId)
      .order("happened_at", { ascending: false }),
  ]);
  const events = eventsRes.data ?? [];
  const eventIds = events.map((e) => e.id);
  const toEventRow = (
    e: (typeof events)[number],
    tags: { id: string; name: string }[]
  ) => ({
    id: e.id,
    type: e.type as EventType,
    stage: e.stage as EventStage,
    happened_at: e.happened_at,
    rejected_at: e.rejected_at ?? null,
    note: e.note ?? null,
    created_at: e.created_at,
    tags,
  });
  if (eventIds.length === 0) {
    return {
      company: companyRes.data,
      events: events.map((e) => toEventRow(e, [])),
    };
  }
  const { data: eventTagsData } = await supabase
    .from("event_tags")
    .select("event_id, tag_id")
    .in("event_id", eventIds);
  const tagIds = [...new Set((eventTagsData ?? []).map((et) => et.tag_id))];
  const tagMap = new Map<string, { id: string; name: string }>();
  if (tagIds.length > 0) {
    const { data: tagsData } = await supabase.from("tags").select("id, name").in("id", tagIds);
    (tagsData ?? []).forEach((t) => tagMap.set(t.id, { id: t.id, name: t.name }));
  }
  const tagsByEvent = new Map<string, { id: string; name: string }[]>();
  (eventTagsData ?? []).forEach((et) => {
    const tag = tagMap.get(et.tag_id);
    if (tag) {
      const list = tagsByEvent.get(et.event_id) ?? [];
      list.push(tag);
      tagsByEvent.set(et.event_id, list);
    }
  });
  const eventsWithTags = events.map((e) =>
    toEventRow(e, tagsByEvent.get(e.id) ?? [])
  );
  return {
    company: companyRes.data,
    events: eventsWithTags,
  };
}
