"use client"

import Link from "next/link"
import { Bell, Leaf, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { UserNav } from "./user-nav"
import { useEffect, useRef, useState } from "react"

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "critical", title: "Critical Incident Report", desc: "Illegal dumping detected near Riverside Drive", time: "2m ago" },
  { id: "2", type: "resolved", title: "Report Resolved", desc: "Water contamination at Lake View has been cleared", time: "15m ago" },
  { id: "3", type: "info", title: "Ghost Mode Active", desc: "Your anonymous report was successfully submitted", time: "1h ago" },
  { id: "4", type: "critical", title: "High-Risk Alert", desc: "Deforestation detected in Northern Ridge sector", time: "2h ago" },
];

const NOTIFICATION_ICONS = {
  critical: AlertTriangle,
  resolved: CheckCircle2,
  info: Info,
};

const NOTIFICATION_STYLES = {
  critical: "border-l-4 border-accent bg-accent/5",
  resolved: "border-l-4 border-secondary bg-secondary/5",
  info: "border-l-4 border-primary bg-primary/5",
};

export function AppHeader({ greeting }: { greeting?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <header className="h-20 bg-background/80 backdrop-blur-md border-b-4 border-primary flex items-center justify-between px-4 sm:px-8 relative z-20 font-body">
      <div className="flex items-center gap-4">
        {greeting ? (
          <h1 className="font-heading font-black text-lg sm:text-2xl uppercase tracking-tight text-primary m-0">
            Welcome back, <span className="text-secondary">{greeting}</span>
          </h1>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-secondary transition-colors">
            <Leaf className="w-6 h-6" />
            <span className="font-heading font-black text-xl uppercase">LikasLens</span>
          </Link>
        )}
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div ref={notifRef} className="relative">
          <button
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((v) => !v)}
            className="relative text-primary hover:text-accent transition-colors mr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full" aria-hidden="true" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 panel-surface border-2 border-primary shadow-[6px_6px_0px_#1b4332] rounded overflow-hidden z-50">
              <div className="p-3 border-b-2 border-primary bg-primary/5 flex items-center justify-between">
                <span className="font-heading font-black text-sm uppercase tracking-wider">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-primary/10 rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((n) => {
                  const Icon = NOTIFICATION_ICONS[n.type];
                  return (
                    <div key={n.id} className={`p-3 border-b border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer ${NOTIFICATION_STYLES[n.type]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm">{n.title}</div>
                          <div className="text-xs surface-muted mt-0.5">{n.desc}</div>
                          <div className="text-xs font-mono surface-muted mt-1">{n.time}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t-2 border-primary text-center">
                <Link href="/dashboard/settings" className="text-xs font-mono font-bold uppercase tracking-wider text-secondary hover:underline" onClick={() => setNotifOpen(false)}>
                  Notification Settings
                </Link>
              </div>
            </div>
          )}
        </div>
        <UserNav />
      </div>
    </header>
  )
}
