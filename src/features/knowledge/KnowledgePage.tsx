import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/api'
import { EmptyState, PageHeader } from '../../components/ui'
import type { KnowledgeItem } from '../../types/database'

const cats = [
  'Services',
  'Pricing',
  'FAQs',
  'Policies',
  'Service Areas',
  'Business Information',
  'General',
]

type Filter = 'all' | 'active' | 'inactive'

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.5 4.5h10.8A2.2 2.2 0 0 1 18.5 6.7V20H7.2a2.7 2.7 0 0 1-2.7-2.7V5.6a1.1 1.1 0 0 1 1-1.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 20H7.2a2.7 2.7 0 0 1 0-5.4h11.3M8 8h7M8 11h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 19 1.2-4.4L15.8 5a2.1 2.1 0 0 1 3 3l-9.6 9.6L5 19Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m13.8 7 3.2 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [filter, setFilter] = useState<Filter>('all')

  async function load() {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    setItems((data ?? []) as KnowledgeItem[])
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)))
  }, [])

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setBusy(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const payload = {
      title: String(form.get('title') || ''),
      content: String(form.get('content') || ''),
      category: String(form.get('category') || 'General'),
      active: true,
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('knowledge_items')
          .update(payload)
          .eq('id', editing.id)

        if (error) throw error
      } else {
        const currentUser = await supabase.auth.getUser()

        if (!currentUser.data.user) {
          throw new Error('Session expired')
        }

        const context = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', currentUser.data.user.id)
          .single()

        if (context.error) throw context.error

        const { error } = await supabase.from('knowledge_items').insert({
          ...payload,
          business_id: context.data.business_id,
        })

        if (error) throw error
      }

      setOpen(false)
      setEditing(null)

      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggle(item: KnowledgeItem) {
    const { error } = await supabase
      .from('knowledge_items')
      .update({ active: !item.active })
      .eq('id', item.id)

    if (error) {
      setError(errorMessage(error))
      return
    }

    await load()
  }

  async function del(item: KnowledgeItem) {
    if (!confirm(`Delete “${item.title}”?`)) return

    const { error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', item.id)

    if (error) {
      setError(errorMessage(error))
      return
    }

    await load()
  }

  function openCreate() {
    setEditing(null)
    setOpen(true)
    setError('')
  }

  function openEdit(item: KnowledgeItem) {
    setEditing(item)
    setOpen(true)
    setError('')
  }

  const activeCount = items.filter((item) => item.active).length
  const inactiveCount = items.length - activeCount

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((item) => item.category)))]
  }, [items])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' && item.active) ||
        (filter === 'inactive' && !item.active)

      const matchesCategory =
        category === 'All' || item.category === category

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)

      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [items, search, category, filter])

  return (
    <>
      <PageHeader
        eyebrow="KNOWLEDGE"
        title="Teach Gideon."
        text="Give Gideon the facts, services and policies it needs to understand your business."
        action={
          <button className="primary knowledge-add-button" onClick={openCreate}>
            <PlusIcon />
            Add knowledge
          </button>
        }
      />

      {error && <div className="alert error">{error}</div>}

      <section className="knowledge-overview">
        <div className="knowledge-overview-intro">
          <div className="knowledge-overview-icon">
            <BookIcon />
          </div>

          <div>
            <strong>Your business knowledge</strong>
            <p>
              These are the facts Gideon can use when answering customer
              questions.
            </p>
          </div>
        </div>

        <div className="knowledge-stats">
          <div>
            <strong>{items.length}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>{activeCount}</strong>
            <span>Active</span>
          </div>

          <div>
            <strong>{inactiveCount}</strong>
            <span>Inactive</span>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <section className="knowledge-controls">
          <div className="knowledge-search">
            <SearchIcon />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your knowledge..."
              aria-label="Search knowledge"
            />
          </div>

          <select
            className="knowledge-category-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div className="knowledge-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>

            <button
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Active
            </button>

            <button
              className={filter === 'inactive' ? 'active' : ''}
              onClick={() => setFilter('inactive')}
            >
              Inactive
            </button>
          </div>
        </section>
      )}

      {!items.length ? (
        <div className="knowledge-empty">
          <div className="knowledge-empty-icon">
            <BookIcon />
          </div>

          <EmptyState
            title="Gideon doesn't know anything yet"
            text="Add your first service, FAQ, pricing detail, business fact or policy."
            action={
              <button className="secondary" onClick={openCreate}>
                Add your first knowledge
              </button>
            }
          />
        </div>
      ) : !filteredItems.length ? (
        <div className="knowledge-no-results">
          <div className="knowledge-empty-icon">
            <SearchIcon />
          </div>

          <h3>No knowledge found</h3>

          <p>
            Try another search, category or status filter.
          </p>

          <button
            className="secondary"
            onClick={() => {
              setSearch('')
              setCategory('All')
              setFilter('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="knowledge-grid">
          {filteredItems.map((item) => (
            <article
              className={`knowledge-card ${!item.active ? 'inactive' : ''}`}
              key={item.id}
            >
              <div className="knowledge-card-head">
                <span className="knowledge-category">
                  {item.category}
                </span>

                <span
                  className={`knowledge-status ${item.active ? 'active' : 'inactive'}`}
                >
                  <span />
                  {item.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3>{item.title}</h3>

              <p className="knowledge-content">
                {item.content}
              </p>

              <div className="knowledge-card-footer">
                <button
                  className="knowledge-action"
                  onClick={() => openEdit(item)}
                >
                  <EditIcon />
                  Edit
                </button>

                <button
                  className="knowledge-action"
                  onClick={() => toggle(item)}
                >
                  {item.active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  className="knowledge-action danger"
                  onClick={() => del(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div
          className="modal-backdrop knowledge-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <form className="modal knowledge-modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {editing ? 'EDIT KNOWLEDGE' : 'NEW KNOWLEDGE'}
                </span>

                <h2>
                  {editing ? 'Update knowledge' : 'Add knowledge'}
                </h2>

                <p>
                  Give Gideon one clear piece of information at a time.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <label>
              Title
              <input
                name="title"
                required
                autoFocus
                defaultValue={editing?.title ?? ''}
                placeholder="e.g. Solar installation service"
              />
            </label>

            <label>
              Category
              <select
                name="category"
                defaultValue={editing?.category ?? 'General'}
              >
                {cats.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Content
              <textarea
                name="content"
                required
                rows={8}
                defaultValue={editing?.content ?? ''}
                placeholder="Write the information Gideon should know..."
              />
            </label>

            <div className="knowledge-form-tip">
              <span>Tip</span>
              <p>
                Keep each knowledge item focused. One clear fact or policy is
                easier for Gideon to use accurately.
              </p>
            </div>

            <div className="knowledge-form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button className="primary" disabled={busy}>
                {busy
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Add knowledge'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
