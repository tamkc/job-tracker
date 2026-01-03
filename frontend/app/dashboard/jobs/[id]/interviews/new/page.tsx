"use client";

import InterviewForm from "@/components/interview-form";
import { useParams } from "next/navigation";

export default function NewInterviewPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="container mx-auto py-10">
      <InterviewForm jobId={id} />
    </div>
  );
}
