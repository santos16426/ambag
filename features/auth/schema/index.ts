import { z } from "zod";

export const authModeSchema = z.enum(["login", "signup"]);

export type AuthMode = z.infer<typeof authModeSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long."),
});

export const signupSchema = loginSchema.extend({
  fullName: z
    .string()
    .min(1, "Please enter your full name.")
    .max(120, "Full name is too long."),
});

export const signupFormSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;

