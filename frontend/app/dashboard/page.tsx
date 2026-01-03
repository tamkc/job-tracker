"use client";

import useAxiosAuth from "@/hooks/useAxiosAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Job, JobListSchema } from "@/lib/schemas";
import { JobTable } from "@/components/job-table";

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
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await axiosAuth.get("/jobs/");
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
    if (jobsLoading) {
      return (
        <div className="text-center py-10 text-gray-500">
          Loading your applications...
        </div>
      );
    }
    if (jobsError) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          Error loading applications. Please try again later.
        </div>
      );
    }
    
    if (!jobs || jobs.length === 0) {
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
    
    const handleDelete = (id: string) => {
         if (confirm("Are you sure you want to delete this application?")) {
            deleteMutation.mutate(id);
         }
    };

    return (
      <JobTable data={jobs} onDelete={handleDelete} />
    );
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Applications
          </h1>
          <p className="text-muted-foreground">
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
        </div>
      </div>

      {renderContent()}
    </div>
  );
}