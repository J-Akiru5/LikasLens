"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { signUp } from "@/app/[locale]/actions/auth";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@likaslens/shared";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");
  return (
    <Button
      variant="ink"
      size="xl"
      type="submit"
      loading={pending}
      className="w-full !bg-[#0f4c5c] hover:!bg-[#0b3844] !text-white !border-transparent"
    >
      {pending ? t("creatingAccount") : (
        <>
          {t("createAccount")} <ArrowRight className="w-5 h-5" />
        </>
      )}
    </Button>
  );
}

export function RegisterClient() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const redirectTo = searchParams.get("redirect_to") || "/dashboard";

  const status = useMemo(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    if (error) return { type: "error" as const, message: error };
    if (message) return { type: "success" as const, message };
    return { type: "" as const, message: "" };
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
      },
    });
  };

  return (
    <main className="min-h-dvh flex flex-col lg:flex-row-reverse bg-page selection:bg-accent/30 selection:text-current">
      {/* Right Panel: Immersive Nature Image with Trust Text (Hidden on small screens, 50% on large) */}
      <div className="hidden lg:flex lg:w-1/2 p-3">
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-ink shadow-2xl flex flex-col justify-end">
          {/* Light Mode: Crystal Clear Beach */}
          <div className="absolute inset-0 z-0 block [[data-theme=ghost]_&]:hidden">
            <Image
              src="/images/auth-nature-bg-v2.png"
              alt="Crystal clear tropical beach"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover scale-105"
              priority
            />
          </div>
          
          {/* Ghost Mode: Coral Reef Undersea */}
          <div className="absolute inset-0 z-0 hidden [[data-theme=ghost]_&]:block">
            <Image
              src="/images/auth-undersea-bg.png"
              alt="Beautiful colorful coral reef with fish"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover scale-105"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-ink/10 pointer-events-none z-0" />
          
          {/* Clean Gradient Overlay for Text Readability at Bottom */}
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-ink/95 via-ink/40 to-transparent pointer-events-none z-0" />
          
          {/* Minimalist Trust Text and Logo at the Bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative z-10 p-12 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <img src="/images/likas-lens-logo.png" alt="LikasLens" className="w-8 h-8 object-contain drop-shadow-lg brightness-0 invert" />
              <span className="font-heading tracking-[0.2em] text-white text-xl flex items-center drop-shadow-lg">
                <span className="font-medium">LIK</span><span className="font-semibold mx-[1px]">Λ</span><span className="font-medium mr-2">S</span><span className="font-bold">LENS</span>
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-snug drop-shadow-lg max-w-md">
              {t("registerTagline")}
            </h2>
          </motion.div>
        </div>
      </div>

      {/* Left Panel: Clean, ultra-minimalist Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Logo for Mobile only */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/5">
              <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            </div>
          </div>

          <div className="mb-10 lg:text-left text-center">
            <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl text-ink mb-2">
              {t("createAccount")}
            </h1>
            <p className="text-ink/60 text-base">
              {t("registerDesc")}
            </p>
          </div>

          {status.message ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                status.type === "error"
                  ? "bg-red/5 border-red/10 text-red"
                  : "bg-green/5 border-green/10 text-green"
              }`}
            >
              {status.message}
            </motion.div>
          ) : null}

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-transparent border border-ink/20 hover:border-ink/30 hover:bg-ink/5 hover:shadow-sm text-ink font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-ink/50" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{t("signUpGoogle")}</span>
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs font-semibold text-ink/40 uppercase tracking-widest">{t("orSignUpEmail")}</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <form action={signUp} className="space-y-5">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3.5 bg-ink/[0.02] border border-ink/10 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition-all placeholder:text-ink/30"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full px-4 py-3.5 bg-ink/[0.02] border border-ink/10 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition-all placeholder:text-ink/30 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label 
              className="flex items-start gap-3 py-2 cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                setAgreed(!agreed);
              }}
            >
              <div className="mt-0.5 relative">
                <input
                  type="checkbox"
                  name="agreeToUpdates"
                  checked={agreed}
                  onChange={() => {}}
                  className="sr-only"
                  required
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-sm ${
                    agreed ? "bg-accent border-accent" : "bg-transparent border-ink/20"
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: agreed ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
              </div>
              <span className="text-sm font-medium text-ink/60 leading-snug group-hover:text-ink/80 transition-colors">
                {t("agreeToTerms")}
              </span>
            </label>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-ink/60">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-ink hover:text-accent transition-colors underline decoration-ink/20 underline-offset-4"
              >
                {t("logIn")}
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="text-xs font-medium text-ink/40 hover:text-ink transition-colors flex items-center justify-center gap-1"
              >
                &larr; {t("backToHome")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}