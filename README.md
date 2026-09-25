# Gideon Business

Phase 1 application foundation for Gideon Business by Alexsco Technologies.

## Stack
React + TypeScript + Vite + React Router + Supabase JS.

## Canonical data model
The app uses the existing Supabase project and these Phase 1 tables:
- businesses
- profiles
- knowledge_items
- knowledge_documents (reserved for future ingestion, not used by UI)
- leads
- conversations
- messages
- agent_logs

The MVP membership model is one authenticated user → one profile → one business.

## Environment
Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a service-role key in the client.

## Routes
`/login`, `/signup`, `/onboarding`, `/dashboard`, `/leads`, `/conversations`, `/conversations/:id`, `/knowledge`, `/settings`.

## Phase 1 scope
The UI provides authentication, onboarding, dashboard counts/activity, knowledge CRUD, leads CRUD/status, web conversations/messages, and business settings. External WhatsApp/Instagram integrations and external AI providers are intentionally not implemented yet.
