// TypeScript types mirroring the backend Pydantic models.
// Keep in sync with categorisation-system-backend/models/

export type AipVersion = {
  s3_key: string;
  page_count: number | null;
  uploaded_at: string;
};

export type AirportOut = {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  city: string | null;
  country: string | null;
  s3_key: string | null;
  aip_available: boolean;
  page_count: number | null;
  aip_versions: AipVersion[];
  last_updated: string | null;
};

export type TemplateSummary = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

export type PromptTemplateOut = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  content: string;
  is_active: boolean;
  created_by_user_id: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};

export type JobStatus =
  | "pending"
  | "running"
  | "ended"
  | "failed"
  | "awaiting_aip";

export type ChunkStatus = "succeeded" | "errored" | "expired" | "canceled";

export type JobChunk = {
  chunk_index: number;
  page_start: number;
  page_end: number;
  custom_id: string;
  status: ChunkStatus | null;
  raw_text: string;
  final_category: string | null;
  confidence_level: string | null;
  error: string | null;
};

export type JobSynthesis = {
  prompt_sent: string;
  raw_response: string;
  final_category: string | null;
  confidence_level: string | null;
  error: string | null;
};

export type JobFinalResult = {
  raw_text: string;
  final_category: string | null;
  confidence_level: string | null;
  error: string | null;
  created_at: string;
};

export type JobOut = {
  id: string;
  title: string;
  organization_id: string;
  created_by_user_id: string;
  airport_id: string | null;
  airport_icao: string;
  airport_name: string | null;
  template_id: string;
  template_name: string | null;
  status: JobStatus;
  batch_id: string | null;
  airport_aip_s3_key: string | null;
  aip_unavailable_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  chunk_count: number;
  chunks: JobChunk[];
  synthesis: JobSynthesis | null;
  final_result: JobFinalResult | null;
  advisory_acknowledged: boolean;
  created_at: string;
  updated_at: string;
};

export type JobSummary = {
  id: string;
  title: string;
  status: JobStatus;
  organization_id: string;
  organization_name: string | null;
  airport_icao: string;
  airport_name: string | null;
  template_name: string | null;
  created_by_user_id: string;
  created_by_email: string | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AppRole = "super-admin" | "admin" | "user";
export type InviteStatus = "pending" | "accepted";

export type UserOut = {
  id: string;
  supertokens_user_id: string;
  email: string;
  full_name: string;
  organization_id: string;
  role: AppRole;
  is_active: boolean;
  /** True when the org being deactivated switched this user off. */
  deactivated_by_org: boolean;
  invite_status: InviteStatus;
  created_at: string;
  eula_accepted: boolean;
  eula_accepted_at: string | null;
};

export type EulaOut = {
  version: string;
  text: string;
};

export type OrganizationOut = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  templates: string[];
  created_at: string;
};
