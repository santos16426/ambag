export type PayoutMethodType = "bank" | "qr";

export interface ProfileSettings {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  avatarPath?: string | null;
  pendingAvatarPath?: string | null;
}

interface BasePayoutMethod {
  id: string;
  type: PayoutMethodType;
}

export interface BankPayoutMethod extends BasePayoutMethod {
  type: "bank";
  bankType: string | null;
  accountName: string | null;
  accountNumber: string;
}

export interface QrPayoutMethod extends BasePayoutMethod {
  type: "qr";
  qrImage: string | null;
}

export type PayoutMethod = BankPayoutMethod | QrPayoutMethod;

export type SettingsModalType = "bank" | "qr" | null;

export interface SettingsStateSnapshot {
  profile: ProfileSettings;
  payoutMethods: PayoutMethod[];
}

