import { useEffect, useState } from 'react';
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

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

import './mobile-nav.css';

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
    to: '/products',
    label: 'Products',
    description: 'Products & services',
    icon: ProductsIcon,
  },
  {
  to: '/inventory',
  label: 'Inventory',
  description: 'Stock levels & movements',
  icon: InventoryIcon,
},
  {
    to: '/settings',
    label: 'Settings',
    description: 'Workspace settings',
    icon: SettingsIcon,
  },
];

// On phones the bottom bar shows the main tabs. Everything else lives
// under "More", so no page is ever hidden as the product grows.
const primaryPaths = [
  '/dashboard',
  '/records',
  '/products',
  '/inventory',
];

const primaryLinks = links.filter((item) =>
  primaryPaths.includes(item.to),
);

const moreLinks = links.filter(
  (item) => !primaryPaths.includes(item.to),
);

export function ProtectedLayout() {
  const {
    session,
    loading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // The "More" sheet is open only for the page it was opened on, so it
  // closes by itself whenever the route changes.
  const [moreOpenPath, setMoreOpenPath] = useState<
    string | null
  >(null);

  const moreOpen = moreOpenPath === location.pathname;

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

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreOpenPath(null);
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [moreOpen]);

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

  const moreActive = moreLinks.some(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(item.to + '/'),
  );

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
        className="mobile-nav mobile-nav-v2"
        aria-label="Mobile navigation"
      >
        {primaryLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpenPath(null)}
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

        <button
          type="button"
          className={
            moreActive || moreOpen
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() =>
            setMoreOpenPath(
              moreOpen ? null : location.pathname,
            )
          }
        >
          <MoreIcon />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div
            className="mobile-more-backdrop"
            onClick={() => setMoreOpenPath(null)}
          />

          <div
            id="mobile-more-menu"
            className="mobile-more-sheet"
            role="dialog"
            aria-label="More menu"
          >
            {moreLinks.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpenPath(null)}
                  className={({ isActive }) =>
                    isActive
                      ? 'mobile-more-item active'
                      : 'mobile-more-item'
                  }
                >
                  <span className="mobile-more-icon">
                    <Icon />
                  </span>

                  <span className="mobile-more-copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </NavLink>
              );
            })}
          </div>
        </>
      )}
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

function ProductsIcon({
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
        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InventoryIcon({
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
        d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M4.5 7.8 12 12l7.5-4.2M12 12v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 5l8 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
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

function MoreIcon({
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
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}
