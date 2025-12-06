"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing Supabase credentials:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  })
}

const supabaseAdmin = createClient(supabaseUrl!, supabaseKey!)

export async function getApplications() {
  try {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("id, status, lead_id, tenant_id, leads(name)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching applications:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error("[v0] Exception in getApplications:", err)
    return { data: [], error: String(err) }
  }
}

export async function getTodaysTasks() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select(`
        id, 
        title, 
        application_id, 
        due_at, 
        status, 
        type,
        applications(
          id,
          leads(name)
        )
      `)
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .order("due_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching tasks:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error("[v0] Exception in getTodaysTasks:", err)
    return { data: [], error: String(err) }
  }
}

export async function createTask(input: {
  applicationId: string
  type: "call" | "email" | "review"
  title: string
  description?: string
  dueAt: string
}) {
  try {
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("tenant_id")
      .eq("id", input.applicationId)
      .single()

    if (appError || !application) {
      console.error("[v0] Application error:", appError)
      return { data: null, error: "Application not found" }
    }

    const insertData = {
      tenant_id: application.tenant_id,
      application_id: input.applicationId,
      type: input.type,
      title: input.title || `${input.type} task`,
      description: input.description || null,
      due_at: new Date(input.dueAt).toISOString(),
      status: "pending",
    }

    const { data, error } = await supabaseAdmin.from("tasks").insert(insertData).select("id").single()

    if (error) {
      console.error("[v0] Insert error:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[v0] Exception in createTask:", err)
    return { data: null, error: String(err) }
  }
}

export async function markTaskComplete(taskId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", taskId)

    if (error) {
      console.error("[v0] Update error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error("[v0] Exception in markTaskComplete:", err)
    return { success: false, error: String(err) }
  }
}

export async function createLeadWithApplication(input: {
  name: string
  email?: string
  phone?: string
}) {
  try {
    const SYSTEM_OWNER_ID = "00000000-0000-0000-0000-000000000001"

    const { data: existingTenants, error: tenantFetchError } = await supabaseAdmin.from("tenants").select("id").limit(1)

    let tenantId: string

    if (tenantFetchError || !existingTenants || existingTenants.length === 0) {
      const { data: newTenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .insert({ name: "Default Organization" })
        .select("id")
        .single()

      if (tenantError || !newTenant) {
        console.error("[v0] Error creating tenant:", tenantError)
        return { data: null, error: "Failed to create organization" }
      }
      tenantId = newTenant.id
    } else {
      tenantId = existingTenants[0].id
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        tenant_id: tenantId,
        owner_id: SYSTEM_OWNER_ID,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        stage: "new",
      })
      .select("id")
      .single()

    if (leadError || !lead) {
      console.error("[v0] Error creating lead:", leadError)
      return { data: null, error: leadError?.message || "Failed to create lead" }
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .insert({
        tenant_id: tenantId,
        lead_id: lead.id,
        status: "pending",
      })
      .select("id, status, lead_id, tenant_id")
      .single()

    if (appError || !application) {
      console.error("[v0] Error creating application:", appError)
      return { data: null, error: appError?.message || "Failed to create application" }
    }

    return {
      data: {
        ...application,
        leads: { name: input.name },
      },
      error: null,
    }
  } catch (err) {
    console.error("[v0] Exception in createLeadWithApplication:", err)
    return { data: null, error: String(err) }
  }
}
