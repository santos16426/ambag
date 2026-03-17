import { z } from "zod";

export const bankMethodSchema = z.object({
  provider: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(64, "Bank name is too long"),
  accountName: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(80, "Account name is too long"),
  accountNumber: z
    .string()
    .trim()
    .min(3, "Account number is required")
    .max(40, "Account number is too long"),
});

export type BankMethodFormValues = z.infer<typeof bankMethodSchema>;

export const qrMethodSchema = z.object({
  qrImage: z
    .string()
    .trim()
    .min(1, "QR image is required"),
});

export type QrMethodFormValues = z.infer<typeof qrMethodSchema>;

