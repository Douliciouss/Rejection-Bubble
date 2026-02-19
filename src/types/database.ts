export type EventType = "reject" | "interview" | "later_applied" | "offer" | "ghost";
export type EventStage = "OA" | "Phone" | "Onsite" | "HR" | "Behavioral" | "Other";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  company_url: string | null;
  created_at: string;
}

export interface BubbleCompany {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  company_url: string | null;
  created_at: string;
  rejections: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  company_id: string;
  type: EventType;
  stage: EventStage;
  happened_at: string;
  rejected_at: string | null;
  note: string | null;
  created_at: string;
}

export interface EventWithCompany extends Event {
  companies: { name: string; logo_url: string | null; company_url: string | null } | null;
}

/** Shape fed to bubble viz: { name, rejections, logo, url } */
export interface BubbleInput {
  id: string;
  name: string;
  rejections: number;
  logo: string | null;
  url: string | null;
}

export const EVENT_STAGES: EventStage[] = ["OA", "Phone", "Onsite", "HR", "Behavioral", "Other"];
export const EVENT_TYPES: EventType[] = ["reject", "interview", "later_applied", "offer", "ghost"];
