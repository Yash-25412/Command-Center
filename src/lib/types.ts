export type Status = "planned" | "active" | "waiting" | "blocked" | "review" | "done" | "cancelled";
export type Priority = "high" | "med" | "low";
export type EntryKind = "update" | "meeting" | "decision" | "status" | "system";

export interface Person {
  id: string;
  name: string;
  is_me: boolean;
  role: string | null;
  active: boolean;
  hue: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  objective: string;
  status: string;
  priority: Priority;
  owner_id: string | null;
  start_date: string | null;
  target_date: string | null;
  health_override: "green" | "amber" | "red" | null;
  pinned: boolean;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  date: string | null;
  done_at: string | null;
  sort_order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string | null;
  doer_id: string | null;
  category_id: string | null;
  status: Status;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  next_action: string;
  waiting_on: string | null;
  waiting_since: string | null;
  expected_by: string | null;
  follow_up_on: string | null;
  focus_on: string | null;
  promised_to: string | null;
  last_activity_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Entry {
  id: string;
  task_id: string | null;
  project_id: string | null;
  kind: EntryKind;
  body: string;
  reason: string | null;
  occurred_at: string;
  status_from: string | null;
  status_to: string | null;
  person_id: string | null;
}

export interface Link {
  id: string;
  task_id: string | null;
  project_id: string | null;
  url: string;
  title: string;
  type: string;
  description: string;
}

export interface Capture {
  id: string;
  text: string;
  created_at: string;
}
