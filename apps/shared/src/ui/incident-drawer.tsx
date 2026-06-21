"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Cpu,
  Link as LinkIcon,
  ExternalLink,
  Hash,
  Box,
  Fingerprint
} from "lucide-react";

export interface Ticket {
  id: string;
  display_id?: string;
  title?: string;
  status: string;
  urgency_score?: number;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  resolved_at?: string | null;
  report_type?: string;
}

interface IncidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Ticket | null;
}

// Deterministic mock hash generator based on incident ID
const generateMockHash = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i);
  }
  const base = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${base}a8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0`.substring(0, 66);
};

// Deterministic mock block number
const generateBlockNum = (id: string) => {
  let num = 0;
  for (let i = 0; i < id.length; i++) {
    num += id.charCodeAt(i);
  }
  return 34912000 + num * 42;
};

export function IncidentDrawer({ isOpen, onClose, incident }: IncidentDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const isGhostMode = !incident?.latitude && !incident?.longitude;
  const txHash = incident ? generateMockHash(incident.id) : "";
  const blockNum = incident ? generateBlockNum(incident.id) : 0;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-page shadow-2xl border-l border-ink/10 transition-transform duration-300 transform flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-ink">Incident Details</h2>
            <p className="text-xs font-mono text-ink/40 uppercase tracking-wider mt-0.5">
              {incident?.display_id || "INC-UNKNOWN"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        {incident && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* 1. Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink leading-snug">
                {incident.title || "Untitled Incident"}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-ink/5 text-ink/70 text-xs font-mono font-bold uppercase tracking-wider rounded-md">
                  {incident.status}
                </span>
                <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-xs font-mono font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {incident.report_type || "Unclassified"}
                </span>
                {isGhostMode && (
                  <span className="px-2.5 py-1 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3" /> Ghost Mode
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 pt-3 border-t border-ink/5">
                <div className="flex items-center gap-3 text-sm text-ink/70">
                  <Clock className="w-4 h-4 text-ink/40" />
                  <span>{new Date(incident.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink/70">
                  <MapPin className="w-4 h-4 text-ink/40" />
                  <span>
                    {isGhostMode 
                      ? "Location scrubbed (Ghost Mode)" 
                      : incident.location || "Unknown location"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. AI Analysis Card */}
            <div className="bg-ink/[0.03] border border-ink/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-ink/80 uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4 text-primary" />
                AI Analysis
              </div>
              <p className="text-sm text-ink/70 leading-relaxed">
                YOLOv8 successfully identified the incident signature. Neuro-symbolic validation cross-referenced the geolocation with local zoning laws.
              </p>
              <div className="flex items-center justify-between bg-white/50 border border-ink/5 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-ink/60">Confidence Score</span>
                <span className="text-sm font-bold text-green">98.4%</span>
              </div>
            </div>

            {/* 3. Blockchain Receipt Card */}
            <div className="bg-[#080c15] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-xl">
              {/* Decorative background glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#2ee6c8]" />
                      <h4 className="text-white font-bold tracking-wide">Ledger Receipt</h4>
                    </div>
                    <p className="text-[#2ee6c8]/60 text-xs font-mono uppercase tracking-widest">
                      Hedera Testnet Verified
                    </p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                    <LinkIcon className="w-5 h-5 text-white/80" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                      <Hash className="w-3 h-3" /> Transaction Hash
                    </div>
                    <div className="text-white/90 font-mono text-xs break-all">
                      {txHash}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                        <Box className="w-3 h-3" /> Block
                      </div>
                      <div className="text-white/90 font-mono text-sm">
                        {blockNum.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> Status
                      </div>
                      <div className="text-[#2ee6c8] font-mono text-sm font-bold flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ee6c8] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ee6c8]"></span>
                        </span>
                        Sealed
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors rounded-xl flex items-center justify-center gap-2 text-white text-xs font-mono font-bold tracking-wider uppercase">
                  View on Explorer <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
