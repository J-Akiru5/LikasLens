import Link from "next/link";
import { Bell, Search, User } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-20 bg-background/80 backdrop-blur-md border-b-4 border-primary flex items-center justify-between px-8 relative z-20 font-body">
      <div className="flex-1">
        <div className="relative max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            className="w-full bg-white border-2 border-primary py-2 pl-10 pr-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-secondary rounded shadow-[2px_2px_0px_#1b4332]"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-primary hover:text-accent transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full"></span>
        </button>
        <div className="h-10 w-10 border-2 border-primary rounded bg-white flex items-center justify-center shadow-[2px_2px_0px_#1b4332]">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>
    </header>
  );
}
