// OAuth Callback Handler
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
console.log(code, origin)
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
    );

    if (!exchangeError) {
      // Profile row is created by createProfileForUser trigger on auth.users.
      // No public.users table in this schema — display name comes from profiles.fullName.
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
