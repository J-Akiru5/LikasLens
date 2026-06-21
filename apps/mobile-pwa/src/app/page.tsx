"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SplashScreen } from "@/components/splash-screen";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const locale = navigator.language?.startsWith("tl") || navigator.language?.startsWith("fil") ? "fil" : "en";
      router.replace(`/${locale}/onboarding`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}
