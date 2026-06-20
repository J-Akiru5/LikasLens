import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@likaslens/shared";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-page selection:bg-accent/30 selection:text-current">
      <div className="w-20 h-20 bg-ink/5 rounded-full flex items-center justify-center mb-6 border border-ink/10">
        <WifiOff className="w-10 h-10 text-ink/40" />
      </div>
      
      <h1 className="text-3xl font-heading font-bold text-ink tracking-tight mb-3 text-center">
        You are offline
      </h1>
      
      <p className="text-ink/60 text-center max-w-sm mb-8 font-medium">
        It looks like you've lost your internet connection. Some features of LikasLens may be unavailable, but you can still access cached pages and submit reports offline.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button variant="ink" size="lg" className="w-full" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
