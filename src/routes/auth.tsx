import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Marginal | AS/A Level Economics marking" },
      {
        name: "description",
        content:
          "Sign in to Marginal to mark Cambridge 9708 Economics essays against your own coursebook, syllabus and mark schemes.",
      },
      { property: "og:title", content: "Sign in — Marginal" },
      {
        property: "og:description",
        content: "Cambridge 9708 Economics essay marking, calibrated to real examiner standards.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [teacherIntent, setTeacherIntent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard", replace: true });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, wants_teacher: teacherIntent },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Check your email to confirm your account, then sign in.");
  };

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-7 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="font-semibold">Marginal</span>
        </Link>

        <div className="panel p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-5 space-y-4">
                <Field id="email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-5 space-y-4">
                <Field id="name" label="Full name" value={fullName} onChange={setFullName} />
                <Field
                  id="email-up"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  id="password-up"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <p className="-mt-1 text-xs text-muted-foreground">
                  Any password of 6 characters or more works — words, spaces and simple
                  phrases are all fine.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="teacher-intent"
                    checked={teacherIntent}
                    onCheckedChange={(value) => setTeacherIntent(value === true)}
                  />
                  <Label htmlFor="teacher-intent" className="text-xs font-normal leading-snug">
                    I'm a teacher, not a student — sign me up for the knowledge base and
                    calibration tools. (Only takes effect for a csacoimbatore.com email.)
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}