import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GITHUB_USER_COOKIE } from "@/lib/github/oauth-config";
import { hasValidSessionCookie } from "@/lib/github/session-cookie";

const PUBLIC_PATHS = ["/login", "/auth", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** API routes that must not be callable without a verified GitHub session. */
function isProtectedApi(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) {
    return false;
  }
  if (pathname.startsWith("/api/github")) {
    return true;
  }
  if (pathname === "/api/analyze-pr" || pathname === "/api/chat") {
    return true;
  }
  return false;
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

async function isGitHubSessionValid(request: NextRequest): Promise<boolean> {
  try {
    const raw = request.cookies.get(GITHUB_USER_COOKIE)?.value;
    return await hasValidSessionCookie(raw);
  } catch {
    return false;
  }
}

async function getSupabaseUser(
  request: NextRequest,
  response: NextResponse,
): Promise<{ user: { id: string } | null; response: NextResponse }> {
  const config = getSupabaseConfig();
  if (!config) {
    return { user: null, response };
  }

  try {
    let supabaseResponse = response;

    const supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { user: user ? { id: user.id } : null, response: supabaseResponse };
  } catch {
    return { user: null, response };
  }
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isProtectedApi(pathname) && !(await isGitHubSessionValid(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let response = NextResponse.next({ request });

  const { user: supabaseUser, response: supabaseResponse } = await getSupabaseUser(
    request,
    response,
  );
  response = supabaseResponse;

  const githubSession = await isGitHubSessionValid(request);
  const isAuthenticated = Boolean(supabaseUser || githubSession);
  const isPublic = isPublicPath(pathname);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
