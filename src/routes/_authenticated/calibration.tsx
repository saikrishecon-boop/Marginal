import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getMe } from "@/lib/account.functions";
import {
  createAnchor,
  deleteAnchor,
  listAnchors,
  setAnchorActive,
} from "@/lib/calibration.functions";

export const Route = createFileRoute("/_authenticated/calibration")({
  head: () => ({
    meta: [
      { title: "Calibration — Marginal Economics" },
      {
        name: "description",
        content:
          "Anchor the marking standard with teacher-verified Economics essays and their confirmed Cambridge marks.",
      },
      { property: "og:title", content: "Calibration — Marginal Economics" },
      {
        property: "og:description",
        content: "Teacher-verified anchor essays that keep marking on the real Cambridge standard.",
      },
    ],
  }),
  component: CalibrationPage,
});

function CalibrationPage() {
  const queryClient = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const fetchAnchors = useServerFn(listAnchors);
  const create = useServerFn(createAnchor);
  const toggle = useServerFn(setAnchorActive);
  const remove = useServerFn(deleteAnchor);

  const anchors = useQuery({ queryKey: ["anchors"], queryFn: () => fetchAnchors() });

  const [question, setQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [mark, setMark] = useState("11");
  const [maxMark, setMaxMark] = useState("12");
  const [bandLabel, setBandLabel] = useState("top");
  const [notes, setNotes] = useState("");

  const isStaff = me.data?.isStaff ?? false;

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          question,
          essayText,
          mark: Number(mark),
          maxMark: Number(maxMark),
          bandLabel: bandLabel as "top" | "middle" | "bottom",
          notes: notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Anchor added — future marking will be calibrated against it.");
      setQuestion("");
      setEssayText("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["anchors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (me.isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="px-5 py-16 md:px-8">
        <div className="panel mx-auto max-w-md px-6 py-10 text-center">
          <h2 className="text-sm font-semibold">Teachers only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Calibration anchors are managed by your teachers. They already ground every mark you
            receive — nothing you need to set up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Calibration anchors"
        description="Real essays with marks you have confirmed. These are shown to the examiner model as worked exemplars, which is what stops it drifting towards safe middle-band marks."
      />

      <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div className="panel space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" /> Add an anchor
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="anchor-question">Question</Label>
            <Textarea
              id="anchor-question"
              rows={2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="anchor-essay">Essay</Label>
            <Textarea
              id="anchor-essay"
              rows={12}
              className="font-mono text-[13px] leading-relaxed"
              value={essayText}
              onChange={(event) => setEssayText(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="anchor-mark">Mark</Label>
              <Input
                id="anchor-mark"
                type="number"
                value={mark}
                onChange={(event) => setMark(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anchor-max">Out of</Label>
              <Input
                id="anchor-max"
                type="number"
                value={maxMark}
                onChange={(event) => setMaxMark(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anchor-band">Band</Label>
              <Select value={bandLabel} onValueChange={setBandLabel}>
                <SelectTrigger id="anchor-band">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="anchor-notes">Examiner note (optional)</Label>
            <Input
              id="anchor-notes"
              placeholder="Why this earns the mark it does"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={
              mutation.isPending || question.trim().length < 10 || essayText.trim().length < 40
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Add anchor"
            )}
          </Button>
        </div>

        <div className="panel">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Anchor library</h2>
          </div>

          {anchors.isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (anchors.data?.length ?? 0) === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No anchors yet. Two or three confirmed essays per band make a noticeable difference to
              marking accuracy.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {anchors.data?.map((anchor) => (
                <li key={anchor.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{anchor.question}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {anchor.essay_text}
                      </p>
                      {anchor.notes ? (
                        <p className="mt-1.5 text-xs text-primary">{anchor.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="secondary">
                        {anchor.mark}/{anchor.max_mark} · {anchor.band_label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={anchor.active}
                          onCheckedChange={async (value) => {
                            await toggle({ data: { id: anchor.id, active: value } });
                            queryClient.invalidateQueries({ queryKey: ["anchors"] });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await remove({ data: { id: anchor.id } });
                            queryClient.invalidateQueries({ queryKey: ["anchors"] });
                            toast.success("Anchor removed.");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}