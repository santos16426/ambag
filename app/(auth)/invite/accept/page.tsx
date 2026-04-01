import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

interface InviteAcceptPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function InviteAcceptPage({
  searchParams,
}: InviteAcceptPageProps) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invalid invite link
          </h1>
          <p className="text-sm text-muted-foreground">
            This invite link is missing a token. Please check the link you
            received or request a new invite.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTarget = `/invite/accept?token=${encodeURIComponent(token)}`;
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const { data, error } = await supabase.rpc("acceptinvitebytoken", {
    invitetoken: token,
  });

  if (error || data !== true) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invite link not valid
          </h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid, expired, or has already been used. If
            you believe this is a mistake, please ask the group owner to send
            you a new invite.
          </p>
        </div>
      </main>
    );
  }

  redirect("/dashboard");
}


