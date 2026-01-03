"use client";

import useAxiosAuth from "@/hooks/useAxiosAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, DollarSign, Link as LinkIcon, Briefcase, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { JobSchema, InterviewListSchema } from "@/lib/schemas";

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const axiosAuth = useAxiosAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await axiosAuth.get(`/jobs/${id}/`);
      return JobSchema.parse(res.data);
    },
    enabled: !!id,
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews", id],
    queryFn: async () => {
      const res = await axiosAuth.get(`/interviews/?job=${id}`);
      return InterviewListSchema.parse(res.data);
    },
    enabled: !!id,
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      await axiosAuth.delete(`/interviews/${interviewId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews", id] });
      toast({
        title: "Interview deleted",
        description: "The interview has been removed.",
      });
    },
  });

  if (jobLoading)
    return <div className="p-8 text-center">Loading job details...</div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      {/* Job Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {job.company_name}
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            {job.job_title}
          </h2>
        </div>
        <div className="flex gap-4">
          <Link href={`/dashboard/jobs/${id}/edit`}>
            <Button variant="outline">Edit Job</Button>
          </Link>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Job Details Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{job.location || "Remote / Unspecified"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>
                    Applied:{" "}
                    {new Date(job.application_date).toLocaleDateString()}
                  </span>
                </div>
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <span>
                      {job.salary_min?.toLocaleString()} -{" "}
                      {job.salary_max?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
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
                </div>
              </div>

              {job.job_url && (
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Job Posting URL
                  </a>
                </div>
              )}

              {job.notes && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                    {job.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviews Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interviews</CardTitle>
              <Link href={`/dashboard/jobs/${id}/interviews/new`}>
                <Button size="sm">Add Interview</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {interviewsLoading ? (
                <div className="text-center py-4">Loading interviews...</div>
              ) : interviews?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No interviews scheduled yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews?.map((interview) => (
                    <div
                      key={interview.id}
                      className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold capitalize">
                            {interview.interview_type} Interview
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(interview.date).toLocaleString()}
                          </span>
                        </div>
                        {interview.outcome && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Outcome:</strong> {interview.outcome}
                          </p>
                        )}
                        {interview.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            {interview.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Delete this interview?")) {
                            deleteInterviewMutation.mutate(interview.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (Timeline or similar could go here) */}
        <div className="space-y-6">
          {/* Placeholder for future widgets like Contact Person, etc. */}
        </div>
      </div>
    </div>
  );
}
