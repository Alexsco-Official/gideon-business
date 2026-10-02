import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentContext, errorMessage } from '../../lib/api';
import { EmptyState, PageHeader } from '../../components/ui';
import type { Business, AgentLog } from '../../types/database';

type Counts = {
  leads: number;
  open: number;
  knowledge: number;
};

export function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [counts, setCounts] = useState<Counts>({
    leads: 0,
    open: 0,
    knowledge: 0,
  });
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const context = await getCurrentContext();

        if (!mounted) return;

        setBusiness(context?.business ?? null);

        if (!context?.business) return;

        const [leads, conversations, knowledge, activity] =
          await Promise.all([
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
              .from('agent_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(5),
          ]);

        for (const result of [
          leads,
          conversations,
          knowledge,
          activity,
        ]) {
          if (result.error) throw result.error;
        }

        if (!mounted) return;

        setCounts({
          leads: leads.count ?? 0,
          open: conversations.count ?? 0,
          knowledge: knowledge.count ?? 0,
        });

        setLogs((activity.data ?? []) as AgentLog[]);
      } catch (e) {
        if (mounted) {
          setError(errorMessage(e));
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalSignals =
    counts.leads + counts.open + counts.knowledge;

  return (
    <>
      <PageHeader
        eyebrow="COMMAND CENTER"
        title={
          business
            ? `Good morning, ${business.name}.`
            : 'Dashboard'
        }
        text="A clear view of the work moving through your business."
      />

      {error && (
        <div className="alert error dashboard-alert">
          {error}
        </div>
      )}

      <section className="dashboard-intro">
        <div>
          <span className="eyebrow">BUSINESS PULSE</span>

          <h2>Your workspace at a glance.</h2>

          <p>
            Gideon is connected to your workspace and ready to
            organize the information that matters to your business.
          </p>
        </div>

        <div className="workspace-status">
          <span className="status-indicator" />
          <div>
            <strong>Workspace active</strong>
            <small>
              {totalSignals === 0
                ? 'Ready for your first records'
                : `${totalSignals} recorded business signals`}
            </small>
          </div>
        </div>
      </section>

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
          description="Conversations requiring attention"
          href="/conversations"
          icon={<ChatIcon />}
        />

        <Stat
          label="Knowledge"
          value={counts.knowledge}
          description="Business information Gideon can use"
          href="/knowledge"
          icon={<BookIcon />}
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="panel dashboard-activity">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>What is happening</h2>
            </div>

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
              text="Gideon will surface useful business activity here as your workspace grows."
            />
          )}
        </div>

        <div className="dashboard-side">
          <div className="panel foundation-card">
            <span className="eyebrow">GIDEON FOUNDATION</span>

            <h2>Build the business context.</h2>

            <p>
              The more useful information you add, the more useful
              Gideon becomes across your future business workflows.
            </p>

            <div className="foundation-items">
              <FoundationItem
                label="Leads"
                value={counts.leads}
                href="/leads"
              />

              <FoundationItem
                label="Open conversations"
                value={counts.open}
                href="/conversations"
              />

              <FoundationItem
                label="Knowledge"
                value={counts.knowledge}
                href="/knowledge"
              />
            </div>

            <Link
              className="dashboard-action"
              to="/knowledge"
            >
              Manage business knowledge
              <ArrowIcon />
            </Link>
          </div>

          <div className="panel workflow-card">
            <span className="eyebrow">OPERATING FLOW</span>

            <h2>From enquiry to completed job.</h2>

            <p>
              Gideon's foundation is designed to eventually connect
              the different stages of running a business.
            </p>

            <div className="workflow">
              <span>Enquiry</span>
              <i>→</i>
              <span>Quote</span>
              <i>→</i>
              <span>Job</span>
              <i>→</i>
              <span>Payment</span>
            </div>
          </div>
        </div>
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

function FoundationItem({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link to={href} className="foundation-item">
      <span>{label}</span>

      <strong>{value}</strong>

      <ArrowIcon />
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
