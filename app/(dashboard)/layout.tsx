import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CurrentUserMenu } from "@/components/dashboard/current-user-menu";
import { UserMenuSkeleton } from "@/components/dashboard/user-menu";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <DashboardShell
      userMenu={
        <Suspense fallback={<UserMenuSkeleton />}>
          <CurrentUserMenu />
        </Suspense>
      }
    >
      {children}
    </DashboardShell>
  );
}
