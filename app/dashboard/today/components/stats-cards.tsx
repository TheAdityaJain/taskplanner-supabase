import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock, ListTodo } from "lucide-react"

interface StatsCardsProps {
  total: number
  pending: number
  completed: number
}

export default function StatsCards({ total, pending, completed }: StatsCardsProps) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
              <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-lg sm:text-2xl font-semibold">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-warning/10 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              <p className="text-lg sm:text-2xl font-semibold">{pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-success/10 shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
              <p className="text-lg sm:text-2xl font-semibold">{completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <div className="text-xs sm:text-sm font-semibold text-accent">{completionRate}%</div>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
              <div className="mt-1 h-2 w-16 sm:w-24 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
