import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface CreateGroupRequestBody {
  name: string;
  description?: string | null;
  memberIds: string[];
  inviteEmails?: string[];
  imageUrl?: string | null;
}

export async function POST(request: Request) {
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

