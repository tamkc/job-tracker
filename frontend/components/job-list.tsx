"use client"

import { useState } from "react"
import { Job } from "@/lib/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Search, ChevronRight, ChevronDown, Briefcase, Building2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface JobListProps {
  jobs: Job[]
  onDelete: (id: string) => void
}

const STATUS_ORDER = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"];

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

export function JobList({ jobs, onDelete }: JobListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set(STATUS_ORDER));

  const toggleStatus = (status: string) => {
    const newExpanded = new Set(expandedStatuses);
    if (newExpanded.has(status)) {
      newExpanded.delete(status);
    } else {
      newExpanded.add(status);
    }
    setExpandedStatuses(newExpanded);
  };

  const filteredJobs = jobs.filter((job) =>
    job.company_name.toLowerCase().includes(search.toLowerCase()) ||
    job.job_title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedJobs = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredJobs.filter((job) => job.status === status);
    return acc;
  }, {} as Record<string, Job[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OFFER": return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "REJECTED": return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "INTERVIEW": return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
      default: return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {STATUS_ORDER.map((status) => {
          const statusJobs = groupedJobs[status] || [];
          if (statusJobs.length === 0 && search) return null; // Hide empty groups when searching if no matches
          
          const isExpanded = expandedStatuses.has(status);

          return (
            <div key={status} className="border rounded-lg overflow-hidden bg-background shadow-sm">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => toggleStatus(status)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    {STATUS_LABELS[status]}
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-5 flex justify-center">
                      {statusJobs.length}
                    </Badge>
                  </h3>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y border-t">
                  {statusJobs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm italic">
                      No applications in this status.
                    </div>
                  ) : (
                    statusJobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="p-4 hover:bg-muted/20 transition-colors group flex items-start justify-between gap-4"
                      >
                        <div 
                          className="flex-1 cursor-pointer space-y-1"
                          onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-base text-foreground group-hover:text-primary transition-colors">
                              {job.company_name}
                            </h4>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider", getStatusColor(job.status))}>
                              {job.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5" />
                              <span>{job.job_title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(job.application_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}

