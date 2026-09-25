import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import { ProtectedLayout } from '../layouts/ProtectedLayout'
import { LoginPage, SignupPage } from '../features/auth/AuthPages'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { KnowledgePage } from '../features/knowledge/KnowledgePage'
import { LeadsPage } from '../features/leads/LeadsPage'
import { ConversationsPage, ConversationDetailPage } from '../features/conversations/ConversationsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
export default function App(){return <BrowserRouter><AuthProvider><Routes>
<Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/><Route path="/onboarding" element={<OnboardingPage/>}/>
<Route element={<ProtectedLayout/>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/leads" element={<LeadsPage/>}/><Route path="/conversations" element={<ConversationsPage/>}/><Route path="/conversations/:id" element={<ConversationDetailPage/>}/><Route path="/knowledge" element={<KnowledgePage/>}/><Route path="/settings" element={<SettingsPage/>}/></Route>
<Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></AuthProvider></BrowserRouter>}
