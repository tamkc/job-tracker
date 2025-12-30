"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useAxiosAuth from "@/hooks/useAxiosAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Loader2, Upload } from "lucide-react"

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(), // Read only mostly
  username: z.string().optional(), // Read only
  bio: z.string().optional(),
  phone_number: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  notification_email_updates: z.boolean().default(true),
  notification_job_alerts: z.boolean().default(true),
})

const passwordSchema = z.object({
  old_password: z.string().min(1, "Old password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_new_password: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Passwords don't match",
  path: ["confirm_new_password"],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const axiosAuth = useAxiosAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      bio: "",
      phone_number: "",
      linkedin_url: "",
      portfolio_url: "",
      notification_email_updates: true,
      notification_job_alerts: true,
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosAuth.get("/profile/")
        const data = res.data
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          username: data.username,
          bio: data.bio || "",
          phone_number: data.phone_number || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
          notification_email_updates: data.notification_email_updates,
          notification_job_alerts: data.notification_job_alerts,
        })
        if (data.avatar) {
          setAvatarPreview(data.avatar)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch profile data.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [axiosAuth, form, toast])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("first_name", data.first_name)
      formData.append("last_name", data.last_name)
      formData.append("bio", data.bio || "")
      formData.append("phone_number", data.phone_number || "")
      formData.append("linkedin_url", data.linkedin_url || "")
      formData.append("portfolio_url", data.portfolio_url || "")
      formData.append("notification_email_updates", String(data.notification_email_updates))
      formData.append("notification_job_alerts", String(data.notification_job_alerts))
      
      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }

      const res = await axiosAuth.put("/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      
      // Update form with returned data to sync state
      const updatedData = res.data
      form.reset({
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
          email: updatedData.email,
          username: updatedData.username,
          bio: updatedData.bio || "",
          phone_number: updatedData.phone_number || "",
          linkedin_url: updatedData.linkedin_url || "",
          portfolio_url: updatedData.portfolio_url || "",
          notification_email_updates: updatedData.notification_email_updates,
          notification_job_alerts: updatedData.notification_job_alerts,
      })
      if (updatedData.avatar) {
          setAvatarPreview(updatedData.avatar)
      }
      setAvatarFile(null)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      await axiosAuth.put("/auth/change-password/", {
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password
      })
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })
      passwordForm.reset()
    } catch (error: any) {
        console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.old_password?.[0] || "Failed to update password. Please check your old password.",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      
      <Separator />

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || ""} />
                  <AvatarFallback>{form.getValues("first_name")?.[0]}{form.getValues("last_name")?.[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      <Upload className="h-4 w-4" />
                      Change Avatar
                    </div>
                  </Label>
                  <Input 
                    id="avatar" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    JPG, GIF or PNG. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...form.register("first_name")} />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...form.register("last_name")} />
                   {form.formState.errors.last_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
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
                  <Input id="username" {...form.register("username")} disabled />
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
                    <p className="text-sm text-destructive">{form.formState.errors.linkedin_url.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input id="portfolio_url" {...form.register("portfolio_url")} />
                   {form.formState.errors.portfolio_url && (
                    <p className="text-sm text-destructive">{form.formState.errors.portfolio_url.message}</p>
                  )}
                </div>
              </div>

               <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about your account activity.</p>
                  </div>
                  <Switch 
                    checked={form.watch("notification_email_updates")}
                    onCheckedChange={(checked) => form.setValue("notification_email_updates", checked)}
                  />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Job Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications about new job matches.</p>
                  </div>
                  <Switch 
                     checked={form.watch("notification_job_alerts")}
                     onCheckedChange={(checked) => form.setValue("notification_job_alerts", checked)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input type="password" id="old_password" {...passwordForm.register("old_password")} />
                {passwordForm.formState.errors.old_password && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.old_password.message}</p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input type="password" id="new_password" {...passwordForm.register("new_password")} />
                {passwordForm.formState.errors.new_password && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                  )}
              </div>
               <div className="space-y-2">
                <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                <Input type="password" id="confirm_new_password" {...passwordForm.register("confirm_new_password")} />
                {passwordForm.formState.errors.confirm_new_password && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirm_new_password.message}</p>
                  )}
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
