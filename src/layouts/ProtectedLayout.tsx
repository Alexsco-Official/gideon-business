import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  getCurrentContext,
  errorMessage,
} from '../lib/api';
import { supabase } from '../lib/supabase';
import type {
  Business,
  Profile,
} from '../types/database';

type IconProps = {
  size?: number;
};

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Business overview',
    icon: DashboardIcon,
  },
  {
    to: '/leads',
    label: 'Leads',
    description: 'Customer opportunities',
    icon: LeadsIcon,
  },
  {
    to: '/conversations',
    label: 'Conversations',
    description: 'Customer messages',
    icon: ConversationsIcon,
  },
  {
    to: '/knowledge',
    label: 'Knowledge',
    description: 'Business information',
    icon: KnowledgeIcon,
  },
  {
    to: '/records',
    label: 'Records',
    description: 'Sales, expenses & payments',
    icon: RecordsIcon,
  },
  {
    to: '/settings',
    label: 'Settings',
    description: 'Workspace settings',
    icon: SettingsIcon,
  },
];

export function ProtectedLayout() {
  const {
    session,
    loading,
  } = useAuth();

  const navigate = useNavigate();

  const [ctx, setCtx] = useState<{
    business: Business;
    profile: Profile;
  } | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', {
        replace: true,
      });

      return;
    }

    if (session) {
      getCurrentContext()
        .then((context) => {
          if (
            !context?.profile ||
            !context.business
          ) {
            navigate('/onboarding', {
              replace: true,
            });

            return;
          }

          setCtx({
            business: context.business,
            profile: context.profile,
          });
        })
        .catch((e) => {
          setError(errorMessage(e));
        });
    }
  }, [
    session,
    loading,
    navigate,
  ]);

  if (loading || !ctx) {
    return (
      <main className="center">
        {error ? (
          <div className="alert error">
            {error}
          </div>
        ) : (
          <div className="loader" />
        )}
      </main>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();

    navigate('/login', {
      replace: true,
    });
  }

  const initials =
    ctx.business.name
      .trim()
      .charAt(0)
      .toUpperCase() || 'G';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand">
            <span className="brand-mark">
              G
            </span>

            <div>
              <strong>Gideon</strong>
              <small>Business</small>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'nav-item active'
                    : 'nav-item'
                }
              >
                <span className="nav-icon">
                  <Icon />
                </span>

                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-card">
            <div className="workspace-avatar">
              {initials}
            </div>

            <div className="workspace-copy">
              <strong>{ctx.business.name}</strong>

              <span>
                {ctx.profile.full_name ||
                  ctx.profile.role ||
                  'Workspace owner'}
              </span>
            </div>
          </div>

          <button
            className="signout-button"
            onClick={signOut}
            type="button"
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="mobile-top">
        <div className="mobile-brand">
          <span className="brand-mark">
            G
          </span>

          <div>
            <strong>Gideon</strong>
            <small>Business</small>
          </div>
        </div>

        <button
          className="mobile-signout"
          onClick={signOut}
          type="button"
          aria-label="Sign out"
        >
          <LogoutIcon />
        </button>
      </div>

      <main className="content">
        <Outlet />
      </main>

      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
      >
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? 'mobile-nav-item active'
                  : 'mobile-nav-item'
              }
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function DashboardIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LeadsIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 19a5.5 5.5 0 0 1 11 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 8h5M18.5 5.5v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConversationsIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19.5 11.5a7 7 0 0 1-7.5 7 8 8 0 0 1-3.7-.9L4 19l1.2-3.4A6.8 6.8 0 0 1 5 11.5a7 7 0 0 1 7-7 7 7 0 0 1 7.5 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.5h.01M12 11.5h.01M15 11.5h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KnowledgeIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v17H7.5A2.5 2.5 0 0 0 5 22V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19M9 7h6M9 10.5h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RecordsIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16v13H4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 7V5h8v2M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon({
  size = 19,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03H6.7v-2.4h.2A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon({
  size = 18,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 5h5v14h-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12h10M11 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
