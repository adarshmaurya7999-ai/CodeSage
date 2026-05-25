import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Exchanges the OAuth code for a session and attaches auth cookies to the redirect.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  // Legacy Supabase callback — sign-in now uses /api/auth/github
  if (!code && !oauthError) {
    const reason = encodeURIComponent(
      "This callback is no longer used. Sign in from the login page with “Continue with GitHub”.",
    );
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
  }

  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  if (oauthError) {
    const reason = encodeURIComponent(oauthError);
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth&reason=missing_code`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

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
          response = NextResponse.redirect(`${origin}${next}`);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    const reason = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
  }

  return response;
}
