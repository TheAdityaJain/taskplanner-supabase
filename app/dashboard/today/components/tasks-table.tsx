"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Phone, Mail, FileSearch, CheckCircle2, Clock, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import TaskDetailsDialog from "./task-details-dialog"
import EditTaskDialog from "./edit-task-dialog"

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

interface TasksTableProps {
  tasks: Task[]
  onMarkComplete: (taskId: string) => void
}

export default function TasksTable({ tasks, onMarkComplete }: TasksTableProps) {
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "email":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20"
      case "review":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      default:
        return "bg-secondary text-muted-foreground"
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid time"
    }
  }

  const isOverdue = (dateString: string) => {
    try {
      return new Date(dateString) < new Date()
    } catch {
      return false
    }
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTaskForDetails(task)
    setDetailsDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTaskForEdit(task)
    setEditDialogOpen(true)
  }

  const handleSaveTask = async (updatedTask: Partial<Task>) => {
    setEditDialogOpen(false)
  }

  if (!tasks || tasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks to display</div>
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1
    if (a.status !== "pending" && b.status === "pending") return 1
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  })

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        {sortedTasks.map((task) => {
          const isPending = task.status === "pending"
          const taskOverdue = isPending && isOverdue(task.due_at)

          return (
            <Card
              key={task.id}
              className={cn("p-2 sm:p-3 lg:p-4 transition-all hover:bg-secondary/50", !isPending && "opacity-60")}
            >
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => isPending && onMarkComplete(task.id)}
                  disabled={!isPending}
                  className={cn(
                    "flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isPending
                      ? "border-muted-foreground hover:border-accent hover:bg-accent/10 cursor-pointer"
                      : "border-success bg-success/10 cursor-default",
                  )}
                >
                  {!isPending && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success" />}
                </button>

                <div
                  className={cn(
                    "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border text-xs sm:text-sm",
                    getTypeStyles(task.type),
                  )}
                >
                  {getTypeIcon(task.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm sm:text-base truncate",
                      !isPending && "line-through text-muted-foreground",
                    )}
                  >
                    {task.title || "Untitled"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {task.applications?.leads?.name || "Unknown Lead"}
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn("font-mono text-xs px-2 py-1", taskOverdue && "border-destructive text-destructive")}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">{formatTime(task.due_at)}</span>
                    <span className="sm:hidden">
                      {formatTime(task.due_at).split(":")[0]}:{formatTime(task.due_at).split(":")[1]}
                    </span>
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 sm:h-8 sm:w-8">
                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(task)} className="text-xs sm:text-sm">
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditTask(task)} className="text-xs sm:text-sm">
                      Edit Task
                    </DropdownMenuItem>
                    {isPending && (
                      <DropdownMenuItem onClick={() => onMarkComplete(task.id)} className="text-xs sm:text-sm">
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>

      <TaskDetailsDialog task={selectedTaskForDetails} open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} />
      <EditTaskDialog
        task={selectedTaskForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveTask}
      />
    </>
  )
}
