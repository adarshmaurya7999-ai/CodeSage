import { getSupabaseAdmin } from "@/lib/db/supabase-admin";
import { requireGitHubSession } from "@/lib/github/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface RiskTimelineRow {
  pr_number: number;
  pr_title: string;
  author: string;
  risk_score: number;
  created_at: string;
  owner: string;
  repo: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireGitHubSession();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured (SUPABASE_SERVICE_KEY missing)." },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    let query = supabase
      .from("pull_requests")
      .select("pr_number, pr_title, author, risk_score, created_at, owner, repo")
      .order("created_at", { ascending: true });

    if (since) {
      query = query.gte("created_at", `${since}T00:00:00.000Z`);
    }
    if (until) {
      query = query.lte("created_at", `${until}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[risk-timeline]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows: RiskTimelineRow[] = (data ?? []).map((row) => ({
      pr_number: row.pr_number,
      pr_title: row.pr_title,
      author: row.author,
      risk_score: Math.min(100, Math.max(0, Number(row.risk_score) ?? 0)),
      created_at: row.created_at,
      owner: row.owner,
      repo: row.repo,
    }));

    return NextResponse.json({ rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load risk timeline";
    const status =
      message.includes("Not signed in") || message.includes("not found in database") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
