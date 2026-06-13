"use client";

import { type ReactNode } from "react";
import { DashboardLayoutWrapper } from "./dashboard-layout-wrapper";

interface DashboardContentProps {
  children: ReactNode;
  greeting?: string;
  userRole?: string | null;
}

export function DashboardContent({
  children,
  greeting,
  userRole,
}: DashboardContentProps) {
  return (
    <DashboardLayoutWrapper greeting={greeting} userRole={userRole}>
      {children}
    </DashboardLayoutWrapper>
  );
}
