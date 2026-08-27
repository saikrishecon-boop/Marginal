import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

export type AppRole = "student" | "teacher" | "admin";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, school").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const roleList = (roles ?? []).map((row) => row.role as AppRole);
    const role: AppRole = roleList.includes("admin")
      ? "admin"
      : roleList.includes("teacher")
        ? "teacher"
        : "student";

    return {
      userId,
      fullName: profile?.full_name ?? null,
      school: profile?.school ?? null,
      role,
      isStaff: role !== "student",
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().trim().max(120).optional(),
        school: z.string().trim().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName ?? null, school: data.school ?? null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });