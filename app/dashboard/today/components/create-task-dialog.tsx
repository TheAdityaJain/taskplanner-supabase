"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApplications, createTask, createLeadWithApplication } from "@/app/actions/tasks"
import { Plus, Phone, Mail, FileSearch, Loader2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  status: string
  lead_id: string
  tenant_id: string
  leads: { name: string } | null
}

interface CreateTaskDialogProps {
  onTaskCreated: () => void
}

const getFutureDateTime = (minutesFromNow = 1) => {
  const date = new Date()
  date.setTime(date.getTime() + minutesFromNow * 60 * 1000)
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const taskTypes = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "review", label: "Review", icon: FileSearch },
]

export default function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [minDateTime, setMinDateTime] = useState("")

  const [showNewLead, setShowNewLead] = useState(false)
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadEmail, setNewLeadEmail] = useState("")
  const [newLeadPhone, setNewLeadPhone] = useState("")
  const [creatingLead, setCreatingLead] = useState(false)

  const [applicationId, setApplicationId] = useState("")
  const [taskType, setTaskType] = useState<"call" | "email" | "review">("call")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueAt, setDueAt] = useState("")

  useEffect(() => {
    if (open) {
      fetchApplications()
      const futureTime = getFutureDateTime(1)
      setDueAt(futureTime)
      setMinDateTime(getFutureDateTime(0.1))
      setError(null)
      setSuccess(false)
      setShowNewLead(false)
      setNewLeadName("")
      setNewLeadEmail("")
      setNewLeadPhone("")
    }
  }, [open])

  const fetchApplications = async () => {
    setLoadingApps(true)
    setError(null)
    try {
      const result = await getApplications()
      if (result.error) {
        setError("Failed to load leads")
        return
      }
      setApplications(result.data || [])
      if (result.data && result.data.length > 0) {
        setApplicationId(result.data[0].id)
      }
    } catch (err) {
      setError("Failed to load leads")
    } finally {
      setLoadingApps(false)
    }
  }

  const handleCreateLead = async () => {
    if (!newLeadName.trim()) {
      setError("Lead name is required")
      return
    }

    setCreatingLead(true)
    setError(null)

    try {
      const result = await createLeadWithApplication({
        name: newLeadName.trim(),
        email: newLeadEmail.trim() || undefined,
        phone: newLeadPhone.trim() || undefined,
      })

      if (result.error || !result.data) {
        setError(result.error || "Failed to create lead")
        return
      }

      const newApp = result.data as Application
      setApplications((prev) => [newApp, ...prev])
      setApplicationId(newApp.id)
      setShowNewLead(false)
      setNewLeadName("")
      setNewLeadEmail("")
      setNewLeadPhone("")
    } catch (err) {
      setError("Failed to create lead")
    } finally {
      setCreatingLead(false)
    }
  }

  const handleCreateTask = async () => {
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (!applicationId) {
      setError("Please select a lead or create a new one")
      setLoading(false)
      return
    }

    if (!dueAt) {
      setError("Please set a due date")
      setLoading(false)
      return
    }

    const selectedDate = new Date(dueAt)
    const now = new Date()
    if (selectedDate <= now) {
      setError("Due date must be in the future")
      setLoading(false)
      return
    }

    const taskData = {
      applicationId,
      type: taskType,
      title: title || `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task`,
      description: description || undefined,
      dueAt: selectedDate.toISOString(),
    }

    try {
      const result = await createTask(taskData)

      if (result.error) {
        setError(`Failed to create task: ${result.error}`)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setTaskType("call")
        setApplicationId("")
        setOpen(false)
        onTaskCreated()
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-[480px] rounded-lg flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Schedule a task for a lead.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm rounded-lg bg-accent/10 border border-accent/20 text-accent">
              Task created successfully!
            </div>
          )}

          <div className="grid gap-3 sm:gap-5 py-4 pr-2 sm:pr-0">
            <div className="grid gap-2">
              <Label className="text-sm sm:text-base">Task Type</Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {taskTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTaskType(type.value as "call" | "email" | "review")}
                    className={cn(
                      "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm",
                      taskType === type.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-muted-foreground/50",
                    )}
                  >
                    <type.icon
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5",
                        taskType === type.value ? "text-accent" : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium leading-tight",
                        taskType === type.value ? "text-accent" : "text-muted-foreground",
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm sm:text-base">Lead</Label>
                <button
                  type="button"
                  onClick={() => setShowNewLead(!showNewLead)}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  <span className="hidden sm:inline">{showNewLead ? "Select existing" : "Add new lead"}</span>
                  <span className="sm:hidden">{showNewLead ? "Select" : "Add"}</span>
                </button>
              </div>

              {showNewLead ? (
                <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 rounded-lg border border-border bg-secondary/50">
                  <div className="grid gap-2">
                    <Label htmlFor="newLeadName" className="text-xs sm:text-sm">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="newLeadName"
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      placeholder="Enter lead name"
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="newLeadEmail" className="text-xs sm:text-sm">
                        Email
                      </Label>
                      <Input
                        id="newLeadEmail"
                        type="email"
                        value={newLeadEmail}
                        onChange={(e) => setNewLeadEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newLeadPhone" className="text-xs sm:text-sm">
                        Phone
                      </Label>
                      <Input
                        id="newLeadPhone"
                        type="tel"
                        value={newLeadPhone}
                        onChange={(e) => setNewLeadPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm h-8 sm:h-9"
                    onClick={handleCreateLead}
                    disabled={creatingLead || !newLeadName.trim()}
                  >
                    {creatingLead ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-2" />
                        Create Lead
                      </>
                    )}
                  </Button>
                </div>
              ) : loadingApps ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading leads...
                </div>
              ) : applications.length === 0 ? (
                <div className="text-xs sm:text-sm text-muted-foreground p-2 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                  No leads found. Click "Add new lead" to create one.
                </div>
              ) : (
                <Select value={applicationId} onValueChange={setApplicationId}>
                  <SelectTrigger className="h-8 sm:h-9 text-sm">
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id} className="text-sm">
                        {app.leads?.name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm sm:text-base">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task`}
                className="h-8 sm:h-9 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm sm:text-base">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueAt" className="text-sm sm:text-base">
                Due Date & Time
              </Label>
              <Input
                id="dueAt"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                min={minDateTime}
                className="h-8 sm:h-9 text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="text-sm h-9 sm:h-10">
            Cancel
          </Button>
          <Button
            onClick={handleCreateTask}
            disabled={loading || (!applicationId && !showNewLead)}
            className="gap-2 text-sm h-9 sm:h-10"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
