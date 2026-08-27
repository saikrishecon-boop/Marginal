import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PenLine,
  Target,
  Dumbbell,
  LineChart,
  Wand2,
  ShieldCheck,
  ListOrdered,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/backend/client";
import { cn } from "@/lib/utils";

const NAV: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  staffOnly: boolean;
  adminOnly?: boolean;
}[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, staffOnly: false },
  { to: "/grade", label: "Essay marking", icon: PenLine, staffOnly: false },
  { to: "/response-structure", label: "Response structure", icon: ListOrdered, staffOnly: false },
  { to: "/practice", label: "AO skills coach", icon: Dumbbell, staffOnly: false },
  { to: "/mcq", label: "MCQ papers", icon: ListChecks, staffOnly: false },
  { to: "/diagrams", label: "Diagram library", icon: LineChart, staffOnly: false },
  { to: "/essay-generator", label: "Essay generator", icon: Wand2, staffOnly: false },
  { to: "/knowledge", label: "Knowledge base", icon: BookOpen, staffOnly: true },
  { to: "/calibration", label: "Calibration", icon: Target, staffOnly: true },
  { to: "/admin", label: "Admin console", icon: ShieldCheck, staffOnly: true, adminOnly: true },
];

function visibleNav(role: "student" | "teacher" | "admin") {
  return NAV.filter(
    (item) => (!item.staffOnly || role !== "student") && (!item.adminOnly || role === "admin"),
  );
}

export function AppShell({
  children,
  role,
  name,
}: {
  children: ReactNode;
  role: "student" | "teacher" | "admin";
  name: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
        <Link to="/dashboard" className="mb-7 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="text-sm leading-tight font-semibold">
            Marginal
            <span className="block text-[11px] font-normal text-muted-foreground">
              Economics 9708
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5">
          {visibleNav(role).map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/75 transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-sidebar-border pt-3">
          <p className="px-2.5 text-sm font-medium">{name ?? "Your account"}</p>
          <p className="px-2.5 pb-2 text-xs text-muted-foreground capitalize">{role}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {visibleNav(role).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap text-muted-foreground",
                pathname.startsWith(item.to) && "bg-accent text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 md:px-8">
      <div>
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
