import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../features/auth/AuthContext';
import { LoginPage, SignupPage } from '../features/auth/AuthPages';
import { ConversationsPage, ConversationDetailPage } from '../features/conversations/ConversationsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { KnowledgePage } from '../features/knowledge/KnowledgePage';
import { LeadsPage } from '../features/leads/LeadsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { RecordsPage } from '../features/records/RecordsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

import { ProtectedLayout } from '../layouts/ProtectedLayout';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/onboarding"
            element={<OnboardingPage />}
          />

          {/* Protected application */}
          <Route element={<ProtectedLayout />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/leads"
              element={<LeadsPage />}
            />

            <Route
              path="/conversations"
              element={<ConversationsPage />}
            />

            <Route
              path="/conversations/:id"
              element={<ConversationDetailPage />}
            />

            <Route
              path="/knowledge"
              element={<KnowledgePage />}
            />

            <Route
              path="/records"
              element={<RecordsPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
