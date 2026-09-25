export type Role = 'owner'|'admin'|'staff'|'agent'
export type LeadStatus = 'new'|'contacted'|'qualified'|'converted'|'lost'
export interface Business { id:string; owner_id:string; name:string; description:string|null; industry:string|null; phone:string|null; email:string|null; created_at:string; updated_at:string }
export interface Profile { id:string; business_id:string; full_name:string|null; role:Role; created_at:string; updated_at:string }
export interface KnowledgeItem { id:string; business_id:string; title:string; content:string; category:string; active:boolean; created_at:string; updated_at:string }
export interface Lead { id:string; business_id:string; name:string|null; phone:string|null; email:string|null; status:LeadStatus; notes:string|null; created_at:string; updated_at:string }
export interface Conversation { id:string; business_id:string; lead_id:string|null; channel:string; status:string; created_at:string; updated_at:string }
export interface Message { id:string; conversation_id:string; role:'user'|'assistant'|'system'; content:string; created_at:string }
export interface AgentLog { id:string; business_id:string; conversation_id:string|null; action:string; status:string; details:Record<string,unknown>; created_at:string }
