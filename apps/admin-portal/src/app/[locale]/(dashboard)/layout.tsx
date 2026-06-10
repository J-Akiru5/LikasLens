import { AdminDashboardLayoutWrapper } from "@/components/admin-layout-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardLayoutWrapper>{children}</AdminDashboardLayoutWrapper>;
}
