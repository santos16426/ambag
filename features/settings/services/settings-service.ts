import { AVATARS_BUCKET } from "@/constants/storage";
import { createClient } from "@/lib/supabase/client";
import type {
  BankPayoutMethod,
  ProfileSettings,
  PayoutMethod,
  SettingsStateSnapshot,
} from "../types";

export async function fetchSettingsSnapshot(
  userId: string,
): Promise<SettingsStateSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("getusersettings", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as {
    userdetails: {
      id: string;
      fullname: string | null;
      email: string | null;
      avatarurl: string | null;
    };
    paymentmethods: Array<{
      id: string;
      userid: string;
      type: "bank" | "qr";
      accountname: string | null;
      accountnumber: string | null;
      banktype: string | null;
      qrcodeurl: string | null;
    }>;
  };

  const user = payload.userdetails;

  const profile: ProfileSettings = {
    id: user.id,
    fullName: user.fullname ?? "",
    email: user.email,
    avatarUrl: null,
    avatarPath: user.avatarurl,
    pendingAvatarPath: null,
  };

  if (profile.avatarPath) {
    const { data } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(profile.avatarPath);
    profile.avatarUrl = data.publicUrl ?? null;
  }

  const payoutMethods: PayoutMethod[] = payload.paymentmethods.map((method) =>
    method.type === "bank"
      ? ({
          id: method.id,
          type: "bank",
          bankType: method.banktype,
          accountName: method.accountname,
          accountNumber: method.accountnumber ?? "",
        } as BankPayoutMethod)
      : {
          id: method.id,
          type: "qr",
          qrImage: method.qrcodeurl,
        },
  );

  return {
    profile,
    payoutMethods,
  };
}

export async function updateProfileSettings(
  profile: ProfileSettings,
): Promise<void> {
  const supabase = createClient();
  const payload = {
    fullName: profile.fullName,
    email: profile.email,
  };

  const { error } = await supabase.rpc("updateprofile", {
    profileid: profile.id,
    payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function profileAvatarPath(userId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `${userId}/${Date.now()}.${ext}`;
}

export interface UploadProfileAvatarResult {
  path: string | null;
  signedUrl: string | null;
  error: Error | null;
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<UploadProfileAvatarResult> {
  const supabase = createClient();
  const path = profileAvatarPath(userId, file);

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) {
    return { path: null, signedUrl: null, error: uploadError };
  }

  const { data: signed } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return {
    path,
    signedUrl: signed?.signedUrl ?? null,
    error: null,
  };
}

export async function commitProfileAvatar(
  profileId: string,
  newPath: string,
  previousPath?: string | null,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("saveimageurl", {
    payload: {
      entitytype: "profile",
      entityid: profileId,
      imageurl: newPath,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (previousPath && previousPath !== newPath) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
  }
}

export async function createBankPaymentMethod(
  input: Omit<BankPayoutMethod, "id" | "type">,
): Promise<PayoutMethod> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("createpaymentmethod", {
    payload: {
      type: "bank",
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      bankType: input.bankType,
      qrCodeUrl: null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    id: row.id,
    type: "bank",
    bankType: row.banktype,
    accountName: row.accountname,
    accountNumber: row.accountnumber ?? "",
  };
}

export async function createQrPaymentMethod(
  qrCodeUrl: string,
): Promise<PayoutMethod> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("createpaymentmethod", {
    payload: {
      type: "qr",
      accountName: null,
      accountNumber: null,
      bankType: null,
      qrCodeUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    id: row.id,
    type: "qr",
    qrImage: row.qrcodeurl,
  };
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("deletepaymentmethod", {
    paymentmethodid: id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

