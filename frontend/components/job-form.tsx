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
import { Job } from "@/lib/schemas";

const jobSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  location: z.string().optional(),
  status: z.enum(["APPLIED", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"]),
  source: z.string().optional(),
  application_date: z.string().min(1, "Date is required"),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  job_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  initialData?: Job;
  isEditing?: boolean;
}

export default function JobForm({
  initialData,
  isEditing = false,
}: Readonly<JobFormProps>) {
  const router = useRouter();
  const axiosAuth = useAxiosAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData
      ? {
          company_name: initialData.company_name,
          job_title: initialData.job_title,
          location: initialData.location || "",
          status: initialData.status,
          source: initialData.source || "",
          application_date: initialData.application_date,
          salary_min: initialData.salary_min?.toString() || "",
          salary_max: initialData.salary_max?.toString() || "",
          job_url: initialData.job_url || "",
          notes: initialData.notes || "",
        }
      : {
          company_name: "",
          job_title: "",
          location: "",
          status: "APPLIED",
          source: "",
          application_date: new Date().toISOString().split("T")[0],
          salary_min: "",
          salary_max: "",
          job_url: "",
          notes: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const payload = {
        ...data,
        salary_min: data.salary_min ? Number.parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? Number.parseInt(data.salary_max) : null,
      };

      if (isEditing && initialData) {
        return axiosAuth.put(`/jobs/${initialData.id}/`, payload);
      } else {
        return axiosAuth.post("/jobs/", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: isEditing ? "Job updated" : "Job created",
        description: isEditing
          ? "Your application has been updated."
          : "Your application has been added to the list.",
      });
      router.push("/dashboard");
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

  const onSubmit = (data: JobFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Application" : "New Application"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" {...form.register("company_name")} />
              {form.formState.errors.company_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.company_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" {...form.register("job_title")} />
              {form.formState.errors.job_title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.job_title.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...form.register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="APPLIED">Applied</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
                <option value="GHOSTED">Ghosted</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g. LinkedIn, Referral"
                {...form.register("source")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_date">Date Applied</Label>
              <Input
                id="application_date"
                type="date"
                {...form.register("application_date")}
              />
              {form.formState.errors.application_date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.application_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Salary Min</Label>
              <Input
                id="salary_min"
                type="number"
                {...form.register("salary_min")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Salary Max</Label>
              <Input
                id="salary_max"
                type="number"
                {...form.register("salary_max")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_url">Job URL</Label>
            <Input
              id="job_url"
              type="url"
              placeholder="https://..."
              {...form.register("job_url")}
            />
            {form.formState.errors.job_url && (
              <p className="text-sm text-red-500">
                {form.formState.errors.job_url.message}
              </p>
            )}
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
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update Application"
                : "Add Application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
