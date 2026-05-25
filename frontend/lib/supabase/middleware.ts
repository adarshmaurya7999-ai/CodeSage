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

async function isGitHubSessionValid(request: NextRequest): Promise<boolean> {
  const raw = request.cookies.get(GITHUB_USER_COOKIE)?.value;
  return hasValidSessionCookie(raw);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedApi(pathname) && !(await isGitHubSessionValid(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const githubSession = await isGitHubSessionValid(request);
  const isAuthenticated = Boolean(user || githubSession);
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

  return supabaseResponse;
}
