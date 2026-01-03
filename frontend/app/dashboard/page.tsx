"use client";

import useAxiosAuth from "@/hooks/useAxiosAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Job, JobListSchema } from "@/lib/schemas";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const axiosAuth = useAxiosAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await axiosAuth.get("/jobs/");
      // Validate response with Zod Schema
      return JobListSchema.parse(res.data);
    },
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosAuth.delete(`/jobs/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Application deleted",
        description: "The job application has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    },
  });

  if (status === "loading")
    return <div className="p-8 flex justify-center">Loading session...</div>;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10 text-gray-500">
          Loading your applications...
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          Error loading applications. Please try again later.
        </div>
      );
    }
    if (jobs?.length === 0) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start tracking your job search today.
          </p>
          <Link href="/dashboard/jobs/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Add First Application
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="grid gap-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {job.company_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {job.job_title}
                </p>
                {job.location && (
                  <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    job.status === "OFFER"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : job.status === "REJECTED"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : job.status === "INTERVIEW"
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}
                >
                  {job.status}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.push(`/dashboard/jobs/${job.id}/edit`)
                    }
                  >
                    <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this application?"
                        )
                      ) {
                        deleteMutation.mutate(job.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Applications
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/jobs/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Application
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/profile")}
            >
              Profile
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
