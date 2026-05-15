"use client"

import Link from "next/link"
import { Bell, Leaf } from "lucide-react"
import { UserNav } from "./user-nav"

export function AppHeader({ greeting }: { greeting?: string }) {
  return (
    <header className="h-20 bg-background/80 backdrop-blur-md border-b-4 border-primary flex items-center justify-between px-8 relative z-20 font-body">
      <div className="flex items-center gap-4">
        {greeting ? (
          <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-primary m-0">
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
        <button className="relative text-primary hover:text-accent transition-colors mr-2">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full"></span>
        </button>
        <UserNav />
      </div>
    </header>
  )
}
