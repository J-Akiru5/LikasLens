import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="lg:pl-64 min-h-screen transition-all duration-200">
        <div className="p-6 lg:p-8 lg:pr-12 max-w-[1600px]">
          {children}
        </div>
      </main>
    </>
  );
}
