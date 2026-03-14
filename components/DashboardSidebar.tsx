"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "New Assessment", href: "/dashboard/assessment" },
  { name: "Reports", href: "/dashboard/reports" },
  { name: "Monthly Tracker", href: "/dashboard/monthly-tracker" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-brand">Carbon Accounting</div>

      <nav className="dashboard-sidebar-nav">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "dashboard-sidebar-link dashboard-sidebar-link-active"
                  : "dashboard-sidebar-link"
              }
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}