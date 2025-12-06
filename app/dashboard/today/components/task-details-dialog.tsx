"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, FileSearch, Clock } from "lucide-react"

interface Task {
  id: string
  title: string
  application_id: string
  due_at: string
  status: string
  type: string
  applications?: {
    id: string
    leads: { name: string } | null
  } | null
}

interface TaskDetailsDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
  if (!task) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "review":
        return <FileSearch className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid date"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>View complete information about this task</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <p className="mt-1 text-base">{task.title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Lead</label>
            <p className="mt-1 text-base">{task.applications?.leads?.name || "Unknown Lead"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <div className="mt-1 flex items-center gap-2">
              {getTypeIcon(task.type)}
              <span className="capitalize">{task.type}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Due Date & Time</label>
            <p className="mt-1 text-base">{formatDateTime(task.due_at)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Badge className="mt-1" variant={task.status === "completed" ? "default" : "secondary"}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
