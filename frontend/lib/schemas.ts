import * as z from "zod";

// Job DTOs
export const JobSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string(),
  job_title: z.string(),
  location: z.string().optional().nullable(), // Allow null as per backend serializer behavior
  status: z.enum(["APPLIED", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"]),
  source: z.string().optional().nullable(),
  application_date: z.string(),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  job_url: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

export const JobListSchema = z.array(JobSchema);

// Interview DTOs
export const InterviewSchema = z.object({
  id: z.number(),
  job: z.string().uuid(),
  interview_type: z.enum(["phone", "technical", "onsite"]),
  date: z.string(),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type Interview = z.infer<typeof InterviewSchema>;

export const InterviewListSchema = z.array(InterviewSchema);

// User Profile DTOs
export const UserProfileSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  linkedin_url: z.string().url().optional().or(z.literal("")).nullable(),
  portfolio_url: z.string().url().optional().or(z.literal("")).nullable(),
  avatar: z.string().nullable().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Resume DTOs
export const ResumeSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  file: z.string().url(),
  uploaded_at: z.string(),
});

export type Resume = z.infer<typeof ResumeSchema>;

export const ResumeListSchema = z.array(ResumeSchema);
