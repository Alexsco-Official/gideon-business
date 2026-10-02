import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

const BUCKET = 'knowledge-files'

type Filter = 'all' | 'active' | 'inactive'

type StoredFile = {
  name: string
  id: string | null
  updated_at: string | null
  metadata?: {
    size?: number
    mimetype?: string
  } | null
}

function Icon({
  type,
}: {
  type:
    | 'book'
    | 'search'
    | 'plus'
    | 'edit'
    | 'close'
    | 'upload'
    | 'file'
    | 'download'
    | 'trash'
}) {
  const paths: Record<string, ReactNode> = {
    book: (
      <>
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
      </>
    ),

    search: (
      <>
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
      </>
    ),

    plus: (
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),

    edit: (
      <>
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
      </>
    ),

    close: (
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),

    upload: (
      <>
        <path
          d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),

    file: (
      <>
        <path
          d="M6 3.5h8l4 4V20.5H6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M14 3.5v4h4M9 12h6M9 15.5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),

    download: (
      <>
        <path
          d="M12 4v11m0 0 4-4m-4 4-4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 20h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),

    trash: (
      <>
        <path
          d="M5 7h14M10 11v5M14 11v5M8 7l.7 13h6.6L16 7M9 7V4h6v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function formatBytes(size = 0) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function cleanFileName(name: string) {
  return name.replace(/^[a-f0-9-]{36}-/, '')
}

function fileLabel(name: string) {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

export function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [files, setFiles] = useState<StoredFile[]>([])
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [filter, setFilter] = useState<Filter>('all')

  async function businessId() {
    const user = await supabase.auth.getUser()

    if (!user.data.user) {
      throw new Error('Session expired')
    }

    const context = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.data.user.id)
      .single()

    if (context.error) throw context.error

    return context.data.business_id as string
  }

  async function load() {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    setItems((data ?? []) as KnowledgeItem[])
  }

  async function loadFiles() {
    const id = await businessId()

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(id, {
        limit: 100,
        sortBy: {
          column: 'name',
          order: 'asc',
        },
      })

    if (error) throw error

    setFiles(
      (data ?? []).filter((file) => file.id !== null) as StoredFile[],
    )
  }

  useEffect(() => {
    Promise.all([load(), loadFiles()]).catch((e) =>
      setError(errorMessage(e)),
    )
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
        const id = await businessId()

        const { error } = await supabase
          .from('knowledge_items')
          .insert({
            ...payload,
            business_id: id,
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

  async function uploadFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selected = Array.from(event.target.files ?? [])

    event.target.value = ''

    if (!selected.length) return

    setUploading(true)
    setError('')

    try {
      const id = await businessId()

      for (const file of selected) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            `${file.name} is larger than the 10 MB limit.`,
          )
        }

        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        )

        const path =
          `${id}/${crypto.randomUUID()}-${safeName}`

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
          })

        if (error) throw error
      }

      await loadFiles()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function downloadFile(file: StoredFile) {
    try {
      const id = await businessId()

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(`${id}/${file.name}`)

      if (error) throw error

      const url = URL.createObjectURL(data)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = cleanFileName(file.name)

      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function deleteFile(file: StoredFile) {
    if (!confirm(`Delete “${cleanFileName(file.name)}”?`)) {
      return
    }

    try {
      const id = await businessId()

      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([`${id}/${file.name}`])

      if (error) throw error

      await loadFiles()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function toggle(item: KnowledgeItem) {
    const { error } = await supabase
      .from('knowledge_items')
      .update({ active: !item.active })
      .eq('id', item.id)

    if (error) {
      setError(errorMessage(error))
    } else {
      await load()
    }
  }

  async function del(item: KnowledgeItem) {
    if (!confirm(`Delete “${item.title}”?`)) return

    const { error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', item.id)

    if (error) {
      setError(errorMessage(error))
    } else {
      await load()
    }
  }

  const activeCount = items.filter(
    (item) => item.active,
  ).length

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(items.map((item) => item.category)),
      ),
    ],
    [items],
  )

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const statusMatch =
        filter === 'all' ||
        (filter === 'active' && item.active) ||
        (filter === 'inactive' && !item.active)

      const categoryMatch =
        category === 'All' ||
        item.category === category

      const searchMatch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)

      return (
        statusMatch &&
        categoryMatch &&
        searchMatch
      )
    })
  }, [items, search, category, filter])

  return (
    <>
      <PageHeader
        eyebrow="KNOWLEDGE"
        title="Teach Gideon."
        text="Give Gideon the facts, services, policies and business documents it needs to understand your business."
        action={
          <div className="knowledge-header-actions">
            <label className="secondary knowledge-upload-button">
              <Icon type="upload" />
              {uploading ? 'Uploading…' : 'Upload files'}

              <input
                type="file"
                multiple
                hidden
                onChange={uploadFiles}
                disabled={uploading}
              />
            </label>

            <button
              className="primary knowledge-add-button"
              onClick={() => {
                setEditing(null)
                setOpen(true)
                setError('')
              }}
            >
              <Icon type="plus" />
              Add knowledge
            </button>
          </div>
        }
      />

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="knowledge-overview">
        <div className="knowledge-overview-intro">
          <div className="knowledge-overview-icon">
            <Icon type="book" />
          </div>

          <div>
            <strong>Your business knowledge</strong>
            <p>
              Structured facts and private documents can
              live together here.
            </p>
          </div>
        </div>

        <div className="knowledge-stats">
          <div>
            <strong>{items.length}</strong>
            <span>Knowledge</span>
          </div>

          <div>
            <strong>{activeCount}</strong>
            <span>Active</span>
          </div>

          <div>
            <strong>{files.length}</strong>
            <span>Files</span>
          </div>
        </div>
      </section>

      <section className="knowledge-files-panel">
        <div className="knowledge-section-head">
          <div>
            <span className="eyebrow">
              BUSINESS DOCUMENTS
            </span>

            <h2>Uploaded files</h2>

            <p>
              Private to this business. Stored separately
              from text knowledge so we can process them
              properly later.
            </p>
          </div>

          <label className="knowledge-drop-button">
            <Icon type="upload" />
            Choose files

            <input
              type="file"
              multiple
              hidden
              onChange={uploadFiles}
              disabled={uploading}
            />
          </label>
        </div>

        {files.length ? (
          <div className="knowledge-file-list">
            {files.map((file) => (
              <article
                className="knowledge-file"
                key={file.id ?? file.name}
              >
                <div className="knowledge-file-icon">
                  <Icon type="file" />
                </div>

                <div className="knowledge-file-main">
                  <strong>
                    {cleanFileName(file.name)}
                  </strong>

                  <span>
                    {fileLabel(file.name)} ·{' '}
                    {formatBytes(file.metadata?.size)} ·
                    {' '}Private
                  </span>
                </div>

                <div className="knowledge-file-actions">
                  <button
                    onClick={() => downloadFile(file)}
                    title="Download"
                  >
                    <Icon type="download" />
                  </button>

                  <button
                    className="danger"
                    onClick={() => deleteFile(file)}
                    title="Delete"
                  >
                    <Icon type="trash" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="knowledge-file-empty">
            <div className="knowledge-empty-icon">
              <Icon type="upload" />
            </div>

            <strong>
              No business documents yet
            </strong>

            <p>
              Upload PDFs, spreadsheets, Word documents,
              images and other supported business files.
            </p>
          </div>
        )}
      </section>

      {items.length > 0 && (
        <section className="knowledge-controls">
          <div className="knowledge-search">
            <Icon type="search" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search your knowledge..."
              aria-label="Search knowledge"
            />
          </div>

          <select
            className="knowledge-category-select"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div className="knowledge-filters">
            <button
              className={
                filter === 'all' ? 'active' : ''
              }
              onClick={() => setFilter('all')}
            >
              All
            </button>

            <button
              className={
                filter === 'active' ? 'active' : ''
              }
              onClick={() => setFilter('active')}
            >
              Active
            </button>

            <button
              className={
                filter === 'inactive' ? 'active' : ''
              }
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
            <Icon type="book" />
          </div>

          <EmptyState
            title="Gideon doesn't know anything yet"
            text="Add your first service, FAQ, pricing detail, business fact or policy."
            action={
              <button
                className="secondary"
                onClick={() => setOpen(true)}
              >
                Add your first knowledge
              </button>
            }
          />
        </div>
      ) : !filteredItems.length ? (
        <div className="knowledge-no-results">
          <div className="knowledge-empty-icon">
            <Icon type="search" />
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
              className={`knowledge-card ${
                !item.active ? 'inactive' : ''
              }`}
              key={item.id}
            >
              <div className="knowledge-card-head">
                <span className="knowledge-category">
                  {item.category}
                </span>

                <span
                  className={`knowledge-status ${
                    item.active ? 'active' : 'inactive'
                  }`}
                >
                  <span />
                  {item.active
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

              <h3>{item.title}</h3>

              <p className="knowledge-content">
                {item.content}
              </p>

              <div className="knowledge-card-footer">
                <button
                  className="knowledge-action"
                  onClick={() => {
                    setEditing(item)
                    setOpen(true)
                  }}
                >
                  <Icon type="edit" />
                  Edit
                </button>

                <button
                  className="knowledge-action"
                  onClick={() => toggle(item)}
                >
                  {item.active
                    ? 'Deactivate'
                    : 'Activate'}
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
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <form
            className="modal knowledge-modal"
            onSubmit={save}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {editing
                    ? 'EDIT KNOWLEDGE'
                    : 'NEW KNOWLEDGE'}
                </span>

                <h2>
                  {editing
                    ? 'Update knowledge'
                    : 'Add knowledge'}
                </h2>

                <p>
                  Give Gideon one clear piece of
                  information at a time.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon type="close" />
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
                defaultValue={
                  editing?.category ?? 'General'
                }
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
                Keep each knowledge item focused. One
                clear fact or policy is easier for Gideon
                to use accurately.
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

              <button
                className="primary"
                disabled={busy}
              >
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
