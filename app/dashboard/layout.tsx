import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />

      <div className="dashboard-shell-main">
        <DashboardHeader />

        <main className="dashboard-shell-content">
          <div className="dashboard-shell-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}