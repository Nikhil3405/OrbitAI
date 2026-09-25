import Sidebar from "@/components/dashboard/sidebar";
import MobileNav from "@/components/dashboard/mobile-nav";

export default function DashboardShell({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}