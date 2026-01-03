import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block fixed inset-y-0">
        <AppSidebar />
      </div>
      <main className="flex-1 md:pl-64">
        <div className="container p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
