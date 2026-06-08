import { AppProvider } from "@/components/providers/app-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="flex min-h-full bg-[var(--bg)]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
          <TopBar />
          <main className="mx-auto w-full max-w-[1180px] flex-1 px-[14px] pb-[calc(96px+env(safe-area-inset-bottom))] pt-[18px] lg:px-9 lg:pb-14 lg:pt-[30px]">
            <div className="screen-enter">{children}</div>
          </main>
        </div>
        <BottomNav />
        <PwaInstallPrompt />
      </div>
    </AppProvider>
  );
}
