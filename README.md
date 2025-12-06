## Stripe Checkout Implementation Guide

### Application Fee Processing with Stripe

To implement Stripe Checkout for application fees, follow these steps:

1. **Create a Checkout Session** - Use the Stripe API to create a checkout session with the `application_fee_amount` parameter set to the desired fee (in cents). This initiates the payment flow for your application.

2. **Store Payment Request** - Save the `payment_intent_id` or `session_id` in your Supabase database along with the application ID and fee amount. This creates an audit trail and enables payment reconciliation.

3. **Handle Stripe Webhook** - Configure a webhook endpoint to receive `charge.succeeded` or `payment_intent.succeeded` events from Stripe. Verify the webhook signature to ensure authenticity of the incoming event.

4. **Update Payment Status** - When the webhook is received, query your database for the matching payment record and update its status to "completed" with the Stripe transaction ID and timestamp.

5. **Update Application Stage/Timeline** - Once payment status is confirmed as completed, trigger a database update to advance the application stage (e.g., from "pending" to "approved") and record the payment timestamp for historical tracking and reporting.

This workflow ensures secure payment processing, maintains data integrity across your system, and provides a complete audit trail for all transactions and stage transitions.


# Lead Management System - Monorepo

A modern lead management system built with Next.js and Supabase, organized as a monorepo with separate frontend and backend directories.

## Project Structure

\`\`\`
├── frontend/              # Next.js application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and Supabase clients
│   ├── package.json
│   └── tsconfig.json
├── backend/              # Backend resources
│   └── edge-functions/   # Supabase edge functions
│       └── create-task/
│           ├── schema.sql        # Database schema
│           ├── rls_policies.sql  # Row Level Security policies
│           └── index.ts          # Edge function implementation
├── package.json          # Root workspace configuration
└── README.md             # This file
\`\`\`

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables in `frontend/.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

4. Set up the database schema:
   - Go to your Supabase dashboard SQL Editor
   - Run the SQL from `backend/edge-functions/create-task/schema.sql`
   - Run the SQL from `backend/edge-functions/create-task/rls_policies.sql`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

## Features

- Task Management: Create and track daily tasks
- Lead Management: Organize leads with applications
- Responsive Design: Mobile-first, fully responsive UI
- Real-time Updates: Supabase integration for real-time data
- Row Level Security: Secure data access with RLS policies

## Technologies

- Next.js 16
- React 19.2
- Supabase PostgreSQL
- Tailwind CSS
- shadcn/ui Components
- TypeScript

## License

MIT
