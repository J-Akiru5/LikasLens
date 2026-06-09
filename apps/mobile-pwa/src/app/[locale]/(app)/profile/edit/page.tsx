"use client";

import { useTranslations } from "next-intl";
import { User } from "lucide-react";

export default function EditProfilePage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col min-h-[100dvh] bg-page pb-24">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif tracking-tight text-ink">
          Edit Profile
        </h1>
      </header>

      <main className="flex-1 p-4">
        <div className="flex flex-col items-center mt-8 mb-8">
          <div className="w-24 h-24 rounded-full bg-green/10 border-2 border-green/30 flex items-center justify-center mb-4 relative">
            <User className="w-10 h-10 text-green" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-page border border-ink/10 rounded-full flex items-center justify-center shadow-md">
              <span className="text-lg">📷</span>
            </div>
          </div>
          <p className="text-ink/60 font-mono text-xs">Tap to change avatar</p>
        </div>

        <form className="space-y-6 mt-8">
          <div>
            <label className="block font-mono text-xs font-bold uppercase mb-2 text-ink/70">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              className="w-full theme-input px-4 py-4 font-medium bg-ink/5 border border-ink/10 rounded-xl text-base focus:border-accent outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            className="w-full bg-accent text-white rounded-2xl py-4 font-semibold tracking-wide text-lg flex items-center justify-center hover:bg-accent/90 transition-colors shadow-lg"
          >
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
}
