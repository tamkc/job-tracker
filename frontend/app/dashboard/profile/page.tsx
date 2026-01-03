"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, Trash2, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resume, ResumeListSchema, UserProfileSchema } from "@/lib/schemas";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(), // Read only mostly
  username: z.string().optional(), // Read only
  bio: z.string().optional(),
  phone_number: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Old password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_new_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Passwords don't match",
    path: ["confirm_new_password"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const axiosAuth = useAxiosAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      bio: "",
      phone_number: "",
      linkedin_url: "",
      portfolio_url: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosAuth.get("/auth/profile/");
        // Validate with DTO Schema
        const data = UserProfileSchema.parse(res.data);
        
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          username: data.username,
          bio: data.bio || "",
          phone_number: data.phone_number || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch profile data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [axiosAuth, form, toast]);

  // Resumes Query
  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await axiosAuth.get("/auth/resumes/");
      return ResumeListSchema.parse(res.data);
    },
  });

  // Resume Mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return axiosAuth.post("/auth/resumes/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setResumeFile(null);
      toast({ title: "Resume uploaded successfully" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload resume.",
      });
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: async (id: string) => {
      return axiosAuth.delete(`/auth/resumes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast({ title: "Resume deleted" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete resume.",
      });
    },
  });

  const handleResumeUpload = () => {
    if (resumeFile) {
      uploadResumeMutation.mutate(resumeFile);
    }
  };

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("bio", data.bio || "");
      formData.append("phone_number", data.phone_number || "");
      formData.append("linkedin_url", data.linkedin_url || "");
      formData.append("portfolio_url", data.portfolio_url || "");

      const res = await axiosAuth.put("/auth/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update form with returned data to sync state
      const updatedData = res.data;
      form.reset({
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        email: updatedData.email,
        username: updatedData.username,
        bio: updatedData.bio || "",
        phone_number: updatedData.phone_number || "",
        linkedin_url: updatedData.linkedin_url || "",
        portfolio_url: updatedData.portfolio_url || "",
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      await axiosAuth.put("/auth/change-password/", {
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      });

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.old_password?.[0] ||
          "Failed to update password. Please check your old password.",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmitProfile)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...form.register("first_name")} />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...form.register("last_name")} />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" {...form.register("email")} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...form.register("username")}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="bio"
                  {...form.register("bio")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" {...form.register("phone_number")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input id="linkedin_url" {...form.register("linkedin_url")} />
                  {form.formState.errors.linkedin_url && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.linkedin_url.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    {...form.register("portfolio_url")}
                  />
                  {form.formState.errors.portfolio_url && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.portfolio_url.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resumes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Resumes</CardTitle>
            <CardDescription>Manage your uploaded resumes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              <Button
                onClick={handleResumeUpload}
                disabled={!resumeFile || uploadResumeMutation.isPending}
              >
                {uploadResumeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upload
              </Button>
            </div>

            <div className="space-y-2 mt-4">
              {resumesLoading && (
                <p className="text-sm text-gray-500">Loading resumes...</p>
              )}
              {resumes?.length === 0 && (
                <p className="text-sm text-gray-500">No resumes uploaded.</p>
              )}
              {resumes?.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{resume.filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(resume.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={resume.file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4 text-gray-500" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this resume?")) {
                          deleteResumeMutation.mutate(resume.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input
                  type="password"
                  id="old_password"
                  {...passwordForm.register("old_password")}
                />
                {passwordForm.formState.errors.old_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.old_password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  type="password"
                  id="new_password"
                  {...passwordForm.register("new_password")}
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_new_password">
                  Confirm New Password
                </Label>
                <Input
                  type="password"
                  id="confirm_new_password"
                  {...passwordForm.register("confirm_new_password")}
                />
                {passwordForm.formState.errors.confirm_new_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirm_new_password.message}
                  </p>
                )}
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
