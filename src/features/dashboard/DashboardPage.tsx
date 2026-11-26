import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentContext, errorMessage } from '../../lib/api';
import { EmptyState, PageHeader } from '../../components/ui';
import { DashboardSkeleton } from '../../components/skeletons';
import type {
  Business,
  AgentLog,
  Profile,
} from '../../types/database';
import './dashboard.css';

type Counts = {
  leads: number;
  open: number;
  knowledge: number;
  products: number;
  sales: number;
};

const emptyCounts: Counts = {
  leads: 0,
  open: 0,
  knowledge: 0,
  products: 0,
  sales: 0,
};

export function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const context = await getCurrentContext();

        if (!mounted) return;

        setBusiness(context?.business ?? null);
        setProfile((context?.profile ?? null) as Profile | null);

        if (!context?.business) return;

        const [
          leads,
          conversations,
          knowledge,
          products,
          sales,
          activity,
        ] = await Promise.all([
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open'),

          supabase
            .from('knowledge_items')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('products')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('sales')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        for (const result of [
          leads,
          conversations,
          knowledge,
          products,
          sales,
          activity,
        ]) {
          if (result.error) throw result.error;
        }

        if (!mounted) return;

        setCounts({
          leads: leads.count ?? 0,
          open: conversations.count ?? 0,
          knowledge: knowledge.count ?? 0,
          products: products.count ?? 0,
          sales: sales.count ?? 0,
        });

        setLogs((activity.data ?? []) as AgentLog[]);
      } catch (e) {
        if (mounted) {
          setError(errorMessage(e));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // The page frame is already on screen, so show the page's outline
  // while the numbers load instead of misleading zeros.
  if (loading) {
    return <DashboardSkeleton />;
  }

  const firstName = profile?.full_name
    ?.trim()
    .split(/\s+/)[0];

  const steps = [
    {
      label: 'Add your products and services',
      done: counts.products > 0,
      href: '/products',
    },
    {
      label: 'Record your first sale',
      done: counts.sales > 0,
      href: '/records',
    },
    {
      label: 'Add a lead',
      done: counts.leads > 0,
      href: '/leads',
    },
    {
      label: 'Add business knowledge',
      done: counts.knowledge > 0,
      href: '/knowledge',
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        text={`Welcome back${firstName ? `, ${firstName}` : ''}. Here is what is happening in ${business?.name ?? 'your business'}.`}
      />

      {error && (
        <div className="alert error dashboard-alert">
          {error}
        </div>
      )}

      <section className="stat-grid dashboard-stats">
        <Stat
          label="Leads"
          value={counts.leads}
          description="Customer opportunities"
          href="/leads"
          icon={<UsersIcon />}
        />

        <Stat
          label="Open conversations"
          value={counts.open}
          description="Waiting for a reply"
          href="/conversations"
          icon={<ChatIcon />}
        />

        <Stat
          label="Knowledge"
          value={counts.knowledge}
          description="Items your assistant can use"
          href="/knowledge"
          icon={<BookIcon />}
        />
      </section>

      <section
        className={
          allDone
            ? 'dashboard-main-grid single'
            : 'dashboard-main-grid'
        }
      >
        <div className="panel dashboard-activity">
          <div className="panel-head">
            <h2>Recent activity</h2>

            {logs.length > 0 && (
              <span className="panel-count">
                {logs.length} recent
              </span>
            )}
          </div>

          {logs.length ? (
            <div className="activity-list">
              {logs.map((log) => (
                <div className="activity" key={log.id}>
                  <span className="activity-icon">
                    <ActivityIcon />
                  </span>

                  <div>
                    <strong>{log.action}</strong>

                    <small>
                      {new Date(log.created_at).toLocaleString()}
                    </small>
                  </div>

                  <span className="status">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No activity yet"
              text="Activity from your workspace will appear here."
            />
          )}
        </div>

        {!allDone && (
          <div className="panel getting-started">
            <h2>Getting started</h2>

            <p className="muted">
              {doneCount} of {steps.length} steps done
            </p>

            <div className="checklist">
              {steps.map((step) => (
                <Link
                  key={step.href}
                  to={step.href}
                  className={
                    step.done
                      ? 'check-item done'
                      : 'check-item'
                  }
                >
                  <span
                    className="check-box"
                    aria-hidden="true"
                  >
                    {step.done && <CheckIcon />}
                  </span>

                  <span className="check-label">
                    {step.label}
                  </span>

                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  description,
  href,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link to={href} className="stat dashboard-stat">
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>

        <span className="stat-arrow">
          <ArrowIcon />
        </span>
      </div>

      <span className="stat-label">{label}</span>

      <strong>{value}</strong>

      <small>{description}</small>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M10 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="9.5"
        cy="7"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 4.8a3.5 3.5 0 0 1 0 6.8M21 20v-1.5a4 4 0 0 0-3-3.87"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.95L4 19l1.1-3.2A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4.5h10a4 4 0 0 1 4 4V20H9a4 4 0 0 0-4 4V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 20a4 4 0 0 1 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 10h3l2-5 3.5 10 2-5H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.5l3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
