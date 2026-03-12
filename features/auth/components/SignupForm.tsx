import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthField } from "./AuthField";
import { signupFormSchema, type SignupFormValues } from "../schema";
import { signupWithEmailPassword } from "../services/auth-service";
import { inputClassName, passwordInputClassName } from "../constants";

interface SignupFormProps {
  redirectPath: string;
}

export function SignupForm({ redirectPath }: SignupFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setServerError("");
    clearErrors();

    const parsed = signupFormSchema.safeParse(data);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (
          typeof path === "string" &&
          (path === "fullName" ||
            path === "email" ||
            path === "password" ||
            path === "confirmPassword")
        ) {
          setError(path as keyof SignupFormValues, {
            type: "manual",
            message: issue.message,
          });
        }
      });
      return;
    }

    try {
      await signupWithEmailPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.fullName,
      });
      router.push(redirectPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setServerError(message);
    }
  };

  return (
    <>
      <form
        className="space-y-3 sm:space-y-4"
        onSubmit={rhfHandleSubmit(onSubmit)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="full-name"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AuthField
              icon={<User className="h-4 w-4" />}
              error={errors.fullName?.message}
            >
              <input
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                className={inputClassName}
                {...register("fullName")}
              />
            </AuthField>
          </motion.div>
        </AnimatePresence>

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
              autoComplete="new-password"
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

        <AuthField
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
        >
          <>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              autoComplete="new-password"
              className={passwordInputClassName}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
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
          {isSubmitting ? "Creating account" : "Create Account"}
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>
    </>
  );
}
