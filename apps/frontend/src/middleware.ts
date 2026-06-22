import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@likaslens/shared";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
