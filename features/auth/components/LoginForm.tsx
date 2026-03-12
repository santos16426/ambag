import { useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import GoogleIcon from "@/components/common/GoogleIcon";

import { AuthField } from "./AuthField";
import { loginSchema, type LoginFormValues } from "../schema";
import {
  loginWithEmailPassword,
  signInWithGoogle,
} from "../services/auth-service";
import { inputClassName, passwordInputClassName } from "../constants";

interface LoginFormProps {
  redirectPath: string;
}

export function LoginForm({ redirectPath }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError("");
    clearErrors();

    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          typeof field === "string" &&
          (field === "email" || field === "password")
        ) {
          setError(field, { type: "manual", message: issue.message });
        }
      });
      return;
    }

    try {
      await loginWithEmailPassword(parsed.data);
      router.push(redirectPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setServerError(message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleLoading) return;
    setServerError("");
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(process.env.NEXT_PUBLIC_APP_URL ?? "");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google.";
      setServerError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <>
      <form
        className="space-y-3 sm:space-y-4"
        onSubmit={rhfHandleSubmit(onSubmit)}
      >
        <AuthField
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
        >
          <input
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            className={inputClassName}
            {...register("email")}
          />
        </AuthField>

        <AuthField
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
        >
          <>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={passwordInputClassName}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </>
        </AuthField>

        {serverError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-center">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600 disabled:opacity-70 sm:rounded-3xl sm:py-5"
        >
          {isSubmitting ? "Logging in" : "Login Now"}
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <div className="relative my-8 sm:my-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            Or Continue with
          </span>
        </div>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-3 text-sm font-medium transition-all hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="flex h-6 w-6 items-center justify-center">
            <GoogleIcon />
          </div>
          <span className="text-sm font-black text-slate-700">
            Continue with Google
          </span>
        </button>
      </div>
    </>
  );
}
