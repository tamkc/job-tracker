"use client";

import JobForm from "@/components/job-form";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function EditJobPage() {
  const params = useParams();
  const id = params.id as string;
  const axiosAuth = useAxiosAuth();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await axiosAuth.get(`/jobs/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading)
    return <div className="p-8 text-center">Loading job details...</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Error loading job details
      </div>
    );

  return (
    <div className="container mx-auto py-10">
      <JobForm initialData={job} isEditing={true} />
    </div>
  );
}
