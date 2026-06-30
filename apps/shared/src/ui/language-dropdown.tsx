"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { locales, localeNames } from "../i18n/config";
import { setLocaleCookie } from "../i18n/language-suggestion";

interface LanguageDropdownProps {
  /** Optional override for the trigger button className */
  buttonClassName?: string;
}

/**
 * Shared language/locale switcher dropdown.
 * Shows all 10 ASEAN locales with native & English names.
 * Handles locale cookie + URL redirect on selection.
 */
export function LanguageDropdown({
  buttonClassName,
}: LanguageDropdownProps) {
  const t = useTranslations("sharedUi");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  const activeLocale =
    typeof params?.locale === "string" ? params.locale : "en";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("switchLanguage")}
        className={
          (buttonClassName ??
            "p-2 rounded-xl text-ink/50 hover:text-ink hover:bg-ink/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2") +
          " flex items-center gap-1.5"
        }
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="text-[11px] font-bold tracking-widest uppercase font-mono mt-[1px]">
          {activeLocale}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-ink/10 bg-page shadow-xl overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-ink/5 bg-ink/[0.02]">
            <span className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-ink/50">
              Language
            </span>
          </div>
          {locales.map((loc) => {
            const name = localeNames[loc];
            const isActive = loc === activeLocale;
            return (
              <button
                key={loc}
                onClick={() => {
                  setOpen(false);
                  setLocaleCookie(loc);
                  const paths = window.location.pathname.split("/");
                  paths[1] = loc;
                  window.location.href = paths.join("/");
                }}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors hover:bg-ink/5 ${
                  isActive ? "bg-accent/5" : ""
                }`}
              >
                <span className="text-xs font-medium text-ink">
                  {name?.native || loc}
                </span>
                <span className="text-[10px] font-mono text-ink/40">
                  {name?.english || ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
