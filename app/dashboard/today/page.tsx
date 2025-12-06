"use client"

import { useEffect, useState, useCallback } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import TasksTable from "./components/tasks-table"
import CreateTaskDialog from "./components/create-task-dialog"
import StatsCards from "./components/stats-cards"
import { getTodaysTasks, markTaskComplete } from "@/app/actions/tasks"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  application_id: string
  due_at: string
  status: string
  type: string
  applications: {
    id: string
    leads: { name: string } | null
  } | null
}

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodaysTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getTodaysTasks()

      if (result.error) {
        setError(result.error)
        setTasks([])
        return
      }

      setTasks((result.data as Task[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks")
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodaysTasks()
  }, [fetchTodaysTasks])

  const handleMarkComplete = async (taskId: string) => {
    try {
      const result = await markTaskComplete(taskId)

      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to update task")
      }

      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  const handleTaskCreated = () => {
    fetchTodaysTasks()
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Today's Tasks</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your daily tasks and follow-ups</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchTodaysTasks}
                disabled={loading}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 bg-transparent"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                <span className="sr-only">Refresh</span>
              </Button>
              <CreateTaskDialog onTaskCreated={handleTaskCreated} />
            </div>
          </div>

          <StatsCards total={tasks.length} pending={pendingTasks.length} completed={completedTasks.length} />
        </div>

        {error && (
          <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-medium">Task Queue</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">{pendingTasks.length} pending</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12 rounded-lg border border-dashed border-border">
              <p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-2">No tasks scheduled for today</p>
              <p className="text-xs sm:text-sm text-muted-foreground/70">Create a new task to get started</p>
            </div>
          ) : (
            <TasksTable tasks={tasks} onMarkComplete={handleMarkComplete} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
