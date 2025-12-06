import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface CreateTaskRequest {
  application_id: string
  task_type: "call" | "email" | "review"
  due_at: string
  title?: string
  description?: string
}

interface CreateTaskResponse {
  success: boolean
  task_id?: string
  error?: string
}

function isValidTaskType(type: unknown): type is "call" | "email" | "review" {
  return type === "call" || type === "email" || type === "review"
}

// Validate ISO date string and check if future
function isValidFutureDate(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const now = new Date()
    return date > now && !isNaN(date.getTime())
  } catch {
    return false
  }
}

// Main handler
serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Parse request body
    const body = (await req.json()) as CreateTaskRequest

    if (!body.application_id || !body.task_type || !body.due_at) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: application_id, task_type, due_at",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!isValidTaskType(body.task_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid task_type. Must be one of: call, email, review",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!isValidFutureDate(body.due_at)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "due_at must be a valid ISO date string in the future",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const supabaseUrl = globalThis.Deno?.env.get("SUPABASE_URL") || ""
    const supabaseKey = globalThis.Deno?.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, lead_id")
      .eq("id", body.application_id)
      .single()

    if (appError || !application) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Application not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("tenant_id")
      .eq("id", application.lead_id)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Lead not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert([
        {
          tenant_id: lead.tenant_id,
          application_id: body.application_id,
          type: body.task_type,
          title: body.title || `${body.task_type} task`,
          description: body.description || null,
          due_at: body.due_at,
          status: "pending",
        },
      ])
      .select("id")
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create task",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    await supabase.channel(`tasks:${lead.tenant_id}`).send({
      type: "broadcast",
      event: "task.created",
      payload: {
        task_id: task.id,
        application_id: body.application_id,
        task_type: body.task_type,
        due_at: body.due_at,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        task_id: task.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
})
