import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/api';
import { EmptyState, PageHeader } from '../../components/ui';
import type { Lead, LeadStatus } from '../../types/database';

const statuses: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
];

function StatusIcon({ status }: { status: LeadStatus }) {
  if (status === 'converted') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12.5 9.5 17 19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === 'lost') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="m7 7 10 10M17 7 7 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (status === 'qualified') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3v18M3 12h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (status === 'contacted') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.9-4.5A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v4l2.5 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeadCard({
  lead,
  onEdit,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}) {
  const status = lead.status as LeadStatus;

  return (
    <article className="lead-card lead-card-premium">
      <div className="lead-card-head">
        <div className={`lead-status ${status}`}>
          <StatusIcon status={status} />
          <span>{status}</span>
        </div>

        <span className="lead-date">
          {new Date(lead.created_at).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="lead-identity">
        <div className="lead-avatar">
          {(lead.name || 'U').trim().charAt(0).toUpperCase()}
        </div>

        <div>
          <h3>{lead.name || 'Unnamed lead'}</h3>
          <span>Customer enquiry</span>
        </div>
      </div>

      {(lead.phone || lead.email) && (
        <div className="lead-contact-list">
          {lead.phone && (
            <div className="lead-contact">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 3.5h3l1.5 4-2 1.5a13 13 0 0 0 6 6l1.5-2 4 1.5v3c0 1-1 1.5-2 1.5C11 19 5 13 5 5.5c0-1 .5-2 1.5-2Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.email && (
            <div className="lead-contact">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m5 7 7 5 7-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{lead.email}</span>
            </div>
          )}
        </div>
      )}

      {lead.notes && (
        <div className="lead-notes">
          <span>Notes</span>
          <p>{lead.notes}</p>
        </div>
      )}

      <button
        type="button"
        className="lead-edit-button"
        onClick={() => onEdit(lead)}
      >
        <span>Edit lead</span>

        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h13M13 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  );
}

export function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');

  async function load() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    setItems((data ?? []) as Lead[]);
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setError('');

    const form = new FormData(e.currentTarget);

    const payload = {
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || '') || null,
      email: String(form.get('email') || '') || null,
      status: String(form.get('status') || 'new'),
      notes: String(form.get('notes') || '') || null,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
      } else {
        const { data: user } = await supabase.auth.getUser();

        if (!user.user) {
          throw new Error('Session expired');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', user.user.id)
          .single();

        if (profileError) throw profileError;

        const { error } = await supabase.from('leads').insert({
          ...payload,
          business_id: profile.business_id,
        });

        if (error) throw error;
      }

      setOpen(false);
      setEditing(null);

      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(() => {
    return {
      all: items.length,
      new: items.filter((x) => x.status === 'new').length,
      contacted: items.filter((x) => x.status === 'contacted').length,
      qualified: items.filter((x) => x.status === 'qualified').length,
      converted: items.filter((x) => x.status === 'converted').length,
      lost: items.filter((x) => x.status === 'lost').length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((lead) => {
      const matchesStatus =
        filter === 'all' || lead.status === filter;

      const matchesSearch =
        !query ||
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.phone || '').toLowerCase().includes(query) ||
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.notes || '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [items, search, filter]);

  function openCreate() {
    setEditing(null);
    setError('');
    setOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setError('');
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="LEADS"
        title="Customer pipeline"
        text="Keep track of enquiries, follow-ups and opportunities from first contact to conversion."
        action={
          <button className="primary leads-add-button" onClick={openCreate}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>Add lead</span>
          </button>
        }
      />

      {error && <div className="alert error leads-alert">{error}</div>}

      <section className="lead-overview">
        <div className="lead-overview-copy">
          <span className="eyebrow">PIPELINE OVERVIEW</span>
          <h2>Your customer opportunities</h2>
          <p>
            A simple view of where your enquiries currently stand.
          </p>
        </div>

        <div className="lead-total">
          <strong>{counts.all}</strong>
          <span>Total leads</span>
        </div>
      </section>

      <section className="lead-summary">
        {(
          [
            ['all', 'All leads'],
            ['new', 'New'],
            ['contacted', 'Contacted'],
            ['qualified', 'Qualified'],
            ['converted', 'Converted'],
            ['lost', 'Lost'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`lead-summary-item ${
              filter === key ? 'active' : ''
            }`}
            onClick={() => setFilter(key)}
          >
            <span>{label}</span>
            <strong>{counts[key]}</strong>
          </button>
        ))}
      </section>

      {items.length > 0 && (
        <section className="lead-toolbar">
          <div className="lead-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle
                cx="10.8"
                cy="10.8"
                r="6.8"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m16 16 4.2 4.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              aria-label="Search leads"
            />

            {search && (
              <button
                type="button"
                className="lead-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="lead-results">
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'lead' : 'leads'}
          </div>
        </section>
      )}

      {!items.length ? (
        <EmptyState
          title="No leads yet"
          text="Add your first customer enquiry to start building the pipeline."
          action={
            <button className="secondary" onClick={openCreate}>
              Add your first lead
            </button>
          }
        />
      ) : !filteredItems.length ? (
        <div className="lead-no-results">
          <div className="empty-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle
                cx="10.8"
                cy="10.8"
                r="6.8"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m16 16 4.2 4.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h3>No matching leads</h3>
          <p>
            Try a different search term or change the pipeline filter.
          </p>

          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="lead-grid lead-grid-premium">
          {filteredItems.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {open && (
        <div
          className="modal-backdrop lead-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setOpen(false);
            }
          }}
        >
          <form className="modal lead-modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">CUSTOMER LEAD</span>
                <h2>{editing ? 'Edit lead' : 'Add a new lead'}</h2>
                <p>
                  {editing
                    ? 'Update this customer opportunity.'
                    : 'Capture the customer details so nothing gets lost.'}
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                disabled={busy}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="lead-form-grid">
              <label>
                Customer name
                <input
                  name="name"
                  defaultValue={editing?.name ?? ''}
                  placeholder="e.g. John Ade"
                  required
                  autoFocus
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  defaultValue={editing?.phone ?? ''}
                  placeholder="e.g. 080..."
                />
              </label>
            </div>

            <label>
              Email address
              <input
                name="email"
                type="email"
                defaultValue={editing?.email ?? ''}
                placeholder="customer@example.com"
              />
            </label>

            <label>
              Pipeline status
              <select
                name="status"
                defaultValue={editing?.status ?? 'new'}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                rows={4}
                defaultValue={editing?.notes ?? ''}
                placeholder="What did the customer ask for? Add useful follow-up notes..."
              />
            </label>

            <div className="lead-form-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>

              <button className="primary" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Create lead'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
