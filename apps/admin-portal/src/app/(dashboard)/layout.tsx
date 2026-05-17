import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="lg:pl-[18rem] min-h-screen p-6 lg:p-8">{children}</main>
    </>
  );
}
