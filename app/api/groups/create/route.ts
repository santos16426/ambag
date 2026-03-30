import { NextResponse } from "next/server";

import { sendInviteEmail } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";
import { serviceRoleClient } from "@/lib/supabase/service-role";

interface GroupInviteRow {
  invitedemail: string | null;
  invitetoken: string;
  status: string;
}

interface CreateGroupRequestBody {
  name: string;
  description?: string | null;
  memberIds: string[];
  inviteEmails?: string[];
  imageUrl?: string | null;
}

export async function POST(request: Request) {
  console.log("[groups/create] request received");
  try {
    const body = (await request.json()) as CreateGroupRequestBody;

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to create a group." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase.rpc("creategroup", {
      payload: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        imageurl: body.imageUrl ?? null,
        memberids: body.memberIds,
        inviteemails: body.inviteEmails ?? [],
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const payload = (data ?? null) as {
      group?: {
        id: string;
        name: string;
        description: string | null;
        imageurl?: string | null;
      } | null;
      autoapproved?: boolean;
    } | null;

    if (!payload?.group) {
      return NextResponse.json(
        { error: "Group was not returned" },
        { status: 500 },
      );
    }

    const group = payload.group;

    if (serviceRoleClient) {
      try {
        const { data: invitesRaw, error: invitesError } = await serviceRoleClient
          .from("groupinvites")
          .select("invitedemail, invitetoken, status")
          .eq("groupid", group.id)
          .eq("status", "pending");

        if (invitesError) {
          console.error(
            "[groups/create] Failed to load group invites for email sending",
            invitesError,
          );
        } else {
          const invites = (invitesRaw ?? []) as GroupInviteRow[];

          if (invites.length > 0) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

            await Promise.allSettled(
              invites
                .filter(
                  (invite) =>
                    typeof invite.invitedemail === "string" &&
                    invite.invitedemail.length > 0,
                )
                .map(async (invite) => {
                  const email = invite.invitedemail as string;

                  let inviteUrl = `${appUrl}/invite/accept?token=${encodeURIComponent(
                    invite.invitetoken,
                  )}`;

                  try {
                    const { data: linkData, error: linkError } =
                      await serviceRoleClient!.auth.admin.generateLink({
                        type: "magiclink",
                        email,
                        options: {
                          redirectTo: inviteUrl,
                        },
                      });

                    const magicLink =
                      (linkData &&
                        typeof (linkData as { [key: string]: unknown }).action_link ===
                          "string" &&
                        ((linkData as { [key: string]: unknown })
                          .action_link as string)) ||
                      undefined;

                    if (!linkError && magicLink) {
                      inviteUrl = magicLink;
                    } else if (linkError) {
                      console.error(
                        "[groups/create] Failed to generate magic link for invite",
                        linkError,
                      );
                    }
                  } catch (linkError) {
                    console.error(
                      "[groups/create] Error while generating magic link for invite",
                      linkError,
                    );
                  }

                  await sendInviteEmail({
                    to: email,
                    groupName: group.name,
                    inviteUrl,
                  });
                }),
            );
          }
        }
      } catch (emailError) {
        console.error(
          "[groups/create] Error while sending invite emails",
          emailError,
        );
      }
    } else {
      console.warn(
        "[groups/create] serviceRoleClient is not configured. Skipping invite emails.",
      );
    }

    return NextResponse.json(
      {
        group,
        autoapproved: payload.autoapproved ?? true,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create group";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

