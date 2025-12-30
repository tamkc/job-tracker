"use client";

import useAxiosAuth from "@/hooks/useAxiosAuth";
import { useQuery } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Job {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  location: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const axiosAuth = useAxiosAuth();

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
      return res.data;
    },

    enabled: !!session,
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
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add First Application
          </button>
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
              <div>
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
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="text-sm font-medium px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Profile
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
