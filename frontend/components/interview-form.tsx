"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Interview } from "@/lib/schemas";

const interviewSchema = z.object({
  interview_type: z.enum(["phone", "technical", "onsite"]),
  date: z.string().min(1, "Date and time is required"),
  outcome: z.string().optional(),
  notes: z.string().optional(),
});

type InterviewFormValues = z.infer<typeof interviewSchema>;

interface InterviewFormProps {
  jobId: string;
  initialData?: Interview;
  isEditing?: boolean;
}

export default function InterviewForm({
  jobId,
  initialData,
  isEditing = false,
}: Readonly<InterviewFormProps>) {
  const router = useRouter();
  const axiosAuth = useAxiosAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: initialData
      ? {
          interview_type: initialData.interview_type,
          date: initialData.date,
          outcome: initialData.outcome || "",
          notes: initialData.notes || "",
        }
      : {
          interview_type: "phone",
          date: "",
          outcome: "",
          notes: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: InterviewFormValues) => {
      const payload = { ...data, job: jobId };
      if (isEditing && initialData) {
        return axiosAuth.put(`/interviews/${initialData.id}/`, payload);
      } else {
        return axiosAuth.post("/interviews/", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews", jobId] });
      toast({
        title: isEditing ? "Interview updated" : "Interview scheduled",
        description: isEditing
          ? "Interview details have been updated."
          : "New interview has been added.",
      });
      router.push(`/dashboard/jobs/${jobId}`);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InterviewFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Interview" : "Schedule Interview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="interview_type">Type</Label>
            <select
              id="interview_type"
              {...form.register("interview_type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="phone">Phone Screen</option>
              <option value="technical">Technical Interview</option>
              <option value="onsite">Onsite Interview</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input id="date" type="datetime-local" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome (Optional)</Label>
            <Input
              id="outcome"
              placeholder="e.g. Passed, Failed, Waiting"
              {...form.register("outcome")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...form.register("notes")}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Interview"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
