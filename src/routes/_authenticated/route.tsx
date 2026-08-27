import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/app/app-shell";
import { supabase } from "@/integrations/backend/client";
import { getMe } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const fetchMe = useServerFn(getMe);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });

  return (
    <AppShell role={data?.role ?? "student"} name={data?.fullName ?? null}>
      <Outlet />
    </AppShell>
  );
}