import { NextResponse } from "next/server";

import { sendInviteEmail } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";
interface AddMembersRequestBody {
  groupId: string;
  members: Array<{
    id: string;
    email: string;
    isExistingUser: boolean;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddMembersRequestBody;
    const groupId = body.groupId?.trim();
    const members = body.members ?? [];

    if (!groupId || members.length === 0) {
      return NextResponse.json(
        { error: "groupId and members are required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: userError?.message ?? "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .single();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 400 });
    }

    const groupName =
      (groupData as { name?: string | null } | null)?.name ?? "your group";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    for (const member of members) {
      const invitedEmail = member.email.toLowerCase().trim();

      if (member.isExistingUser) {
        const { error } = await supabase.rpc("creategroupmember", {
          payload: {
            groupid: groupId,
            userid: member.id,
            role: "member",
            status: "active",
          },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        continue;
      }

      // Invite by email: store as pending in groupinvites (same flow as group creation).
      const inviteToken = crypto.randomUUID();

      const { error: inviteError } = await supabase.rpc("creategroupinvite", {
        payload: {
          groupId,
          invitedEmail,
          inviteToken,
        },
      });

      if (inviteError) {
        return NextResponse.json(
          { error: inviteError.message },
          { status: 400 },
        );
      }

      const inviteUrl = `${appUrl}/invite/accept?token=${encodeURIComponent(inviteToken)}`;

      await sendInviteEmail({ to: invitedEmail, groupName, inviteUrl });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add group members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
