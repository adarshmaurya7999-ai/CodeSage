/** Structured finding from LLM analysis (snake_case matches Supabase columns). */
export interface Finding {
  severity: string;
  category: string;
  owasp_code?: string | null;
  owasp_name?: string | null;
  file: string;
  line: number;
  comment: string;
  fix_suggestion?: string | null;
}
