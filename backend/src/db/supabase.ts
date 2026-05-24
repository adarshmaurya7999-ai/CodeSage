import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Row shape for `pull_requests` (matches supabase/schema.sql). */
export interface PullRequestRow {
  id: string;
  owner: string;
  repo: string;
  pr_number: number;
  pr_title: string;
  author: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  commit_sha: string;
  created_at: string;
}

/** Row shape for `findings` (matches supabase/schema.sql). */
export interface FindingRow {
  id: string;
  pull_request_id: string;
  severity: string;
  category: string;
  owasp_code: string | null;
  owasp_name: string | null;
  file: string;
  line: number;
  comment: string;
  fix_suggestion: string | null;
  created_at: string;
}

export type PullRequestInsert = {
  id?: string;
  owner: string;
  repo: string;
  pr_number: number;
  pr_title: string;
  author: string;
  risk_score?: number;
  risk_level?: string;
  summary?: string;
  commit_sha: string;
  created_at?: string;
};

export type FindingInsert = {
  id?: string;
  pull_request_id: string;
  severity: string;
  category: string;
  owasp_code?: string | null;
  owasp_name?: string | null;
  file: string;
  line: number;
  comment: string;
  fix_suggestion?: string | null;
  created_at?: string;
};

export interface Database {
  public: {
    Tables: {
      pull_requests: {
        Row: PullRequestRow;
        Insert: PullRequestInsert;
        Update: Partial<PullRequestInsert>;
        Relationships: [];
      };
      findings: {
        Row: FindingRow;
        Insert: FindingInsert;
        Update: Partial<FindingInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

let client: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Returns a singleton Supabase client for server-side use (service role).
 * Use this for all backend DB access — bypasses RLS appropriately for trusted server code.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_KEY");

    client = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}

/**
 * Verifies Supabase is reachable and `pull_requests` is queryable.
 * @throws Error when credentials are wrong or the schema is missing
 */
export async function testSupabaseConnection(): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from("pull_requests").select("id").limit(1);

  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}
