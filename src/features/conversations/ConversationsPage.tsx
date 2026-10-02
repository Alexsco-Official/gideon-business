import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/api'
import { EmptyState, PageHeader } from '../../components/ui'
import type { Conversation, Message, Lead } from '../../types/database'

type ConversationWithLead = Conversation & {
  lead?: Lead | null
}

type Filter = 'all' | 'open' | 'closed'

function initials(name?: string | null) {
  if (!name) return 'WC'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function channelLabel(channel: string) {
  return channel.charAt(0).toUpperCase() + channel.slice(1)
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5h-7.2L7 20.5v-3H5A2.5 2.5 0 0 1 2.5 15V8A2.5 2.5 0 0 1 5 5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7 10h10M7 13h6"
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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19 12H6M11 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m21 3-7.4 18-3.2-7.4L3 10.4 21 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 13.5 21 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ConversationCard({
  conversation,
}: {
  conversation: ConversationWithLead
}) {
  const customerName = conversation.lead?.name || 'Web conversation'

  return (
    <Link
      className="conversation-item"
      to={`/conversations/${conversation.id}`}
    >
      <div className="conversation-avatar">
        {initials(conversation.lead?.name)}
      </div>

      <div className="conversation-item-main">
        <div className="conversation-item-top">
          <h3>{customerName}</h3>
          <span className="conversation-time">
            {formatRelativeDate(conversation.created_at)}
          </span>
        </div>

        <div className="conversation-item-meta">
          <span className="conversation-channel">
            {channelLabel(conversation.channel)}
          </span>

          <span
            className={`conversation-status ${conversation.status === 'open' ? 'is-open' : 'is-closed'}`}
          >
            <span />
            {statusLabel(conversation.status)}
          </span>
        </div>

        <p className="conversation-preview">
          {conversation.lead?.email ||
            'No customer message yet. Open the conversation to continue.'}
        </p>
      </div>

      <span className="conversation-arrow">
        <ArrowIcon />
      </span>
    </Link>
  )
}

export function ConversationsPage() {
  const [items, setItems] = useState<ConversationWithLead[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, leads(*)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setItems(
        (data ?? []).map((item: any) => ({
          ...item,
          lead: item.leads,
        })),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)))
  }, [])

  async function create() {
    try {
      setError('')

      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error('Session expired')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', userData.user.id)
        .single()

      if (profileError) throw profileError

      const { data, error: createError } = await supabase
        .from('conversations')
        .insert({
          business_id: profile.business_id,
          channel: 'web',
          status: 'open',
        })
        .select()
        .single()

      if (createError) throw createError

      window.location.href = `/conversations/${data.id}`
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesFilter =
        filter === 'all' || item.status?.toLowerCase() === filter

      if (!matchesFilter) return false

      if (!query) return true

      const customerName = item.lead?.name?.toLowerCase() || ''
      const email = item.lead?.email?.toLowerCase() || ''
      const channel = item.channel?.toLowerCase() || ''

      return (
        customerName.includes(query) ||
        email.includes(query) ||
        channel.includes(query)
      )
    })
  }, [items, search, filter])

  const openCount = items.filter((item) => item.status === 'open').length
  const closedCount = items.filter((item) => item.status === 'closed').length

  return (
    <>
      <PageHeader
        eyebrow="CONVERSATIONS"
        title="Customer conversations"
        text="Keep customer conversations organized and ready for action."
        action={
          <button className="primary" onClick={create}>
            New conversation
          </button>
        }
      />

      {error && <div className="alert error">{error}</div>}

      <section className="conversation-toolbar">
        <div className="conversation-summary">
          <div>
            <strong>{items.length}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>{openCount}</strong>
            <span>Open</span>
          </div>

          <div>
            <strong>{closedCount}</strong>
            <span>Closed</span>
          </div>
        </div>

        <div className="conversation-controls">
          <div className="conversation-search">
            <SearchIcon />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
            />
          </div>

          <div className="conversation-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>

            <button
              className={filter === 'open' ? 'active' : ''}
              onClick={() => setFilter('open')}
            >
              Open
            </button>

            <button
              className={filter === 'closed' ? 'active' : ''}
              onClick={() => setFilter('closed')}
            >
              Closed
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="conversation-loading">
          <div className="loader" />
          <p>Loading conversations...</p>
        </div>
      ) : !items.length ? (
        <div className="conversation-empty">
          <div className="conversation-empty-icon">
            <MessageIcon />
          </div>

          <EmptyState
            title="No conversations yet"
            text="Start a web conversation to test the workspace. WhatsApp and Instagram are not connected in Phase 1."
            action={
              <button className="secondary" onClick={create}>
                Start conversation
              </button>
            }
          />
        </div>
      ) : !filteredItems.length ? (
        <div className="conversation-no-results">
          <div className="conversation-empty-icon">
            <SearchIcon />
          </div>
          <h3>No conversations found</h3>
          <p>Try another search or change the current filter.</p>
          <button
            className="secondary"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="conversation-list">
          {filteredItems.map((item) => (
            <ConversationCard key={item.id} conversation={item} />
          ))}
        </div>
      )}
    </>
  )
}

export function ConversationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!id) return

    setLoading(true)

    try {
      const [conversationResult, messagesResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('*, leads(*)')
          .eq('id', id)
          .single(),

        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true }),
      ])

      if (conversationResult.error) throw conversationResult.error
      if (messagesResult.error) throw messagesResult.error

      const rawConversation: any = conversationResult.data

      setConversation(rawConversation as Conversation)
      setLead(rawConversation?.leads ?? null)
      setMessages((messagesResult.data ?? []) as Message[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)))
  }, [id])

  async function send(event: FormEvent) {
    event.preventDefault()

    const content = text.trim()

    if (!content || !id) return

    setBusy(true)
    setError('')

    setText('')

    const { error: sendError } = await supabase.from('messages').insert({
      conversation_id: id,
      role: 'user',
      content,
    })

    if (sendError) {
      setError(errorMessage(sendError))
      setText(content)
    } else {
      await load()
    }

    setBusy(false)
  }

  if (loading) {
    return (
      <section className="conversation-detail-loading">
        <div className="loader" />
        <p>Loading conversation...</p>
      </section>
    )
  }

  if (!conversation) {
    return (
      <section className="conversation-detail-error">
        {error ? (
          <div className="alert error">{error}</div>
        ) : (
          <EmptyState
            title="Conversation not found"
            text="This conversation may have been removed or you may not have access to it."
            action={
              <button
                className="secondary"
                onClick={() => navigate('/conversations')}
              >
                Back to conversations
              </button>
            }
          />
        )}
      </section>
    )
  }

  const customerName = lead?.name || 'Web conversation'

  return (
    <section className="conversation-workspace">
      <header className="conversation-chat-header">
        <button
          className="conversation-back"
          onClick={() => navigate('/conversations')}
          aria-label="Back to conversations"
        >
          <BackIcon />
          <span>Conversations</span>
        </button>

        <div className="conversation-customer">
          <div className="conversation-avatar large">
            {initials(lead?.name)}
          </div>

          <div>
            <div className="conversation-customer-name">
              <h1>{customerName}</h1>
              <span
                className={`conversation-status ${conversation.status === 'open' ? 'is-open' : 'is-closed'}`}
              >
                <span />
                {statusLabel(conversation.status)}
              </span>
            </div>

            <p>
              {channelLabel(conversation.channel)}
              {lead?.email ? ` · ${lead.email}` : ''}
            </p>
          </div>
        </div>

        <div className="conversation-chat-badge">
          <MessageIcon />
          <span>{messages.length}</span>
        </div>
      </header>

      <div className="conversation-message-area">
        {messages.length ? (
          <div className="conversation-messages">
            <div className="conversation-start">
              <span>Conversation started</span>
            </div>

            {messages.map((message) => {
              const isUser = message.role === 'user'

              return (
                <div
                  className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}
                  key={message.id}
                >
                  <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                    <div className="chat-bubble-label">
                      {isUser ? 'You' : 'Gideon'}
                    </div>

                    <p>{message.content}</p>

                    <time>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="conversation-no-messages">
            <div className="conversation-empty-icon">
              <MessageIcon />
            </div>

            <h2>No messages yet</h2>
            <p>
              Send the first message below to create an interaction.
            </p>
          </div>
        )}
      </div>

      <form className="conversation-composer" onSubmit={send}>
        <div className="composer-input-wrap">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message..."
            aria-label="Message"
            disabled={busy}
          />

          <button
            className="composer-send"
            type="submit"
            disabled={busy || !text.trim()}
            aria-label="Send message"
          >
            <SendIcon />
            <span>Send</span>
          </button>
        </div>

        <div className="composer-hint">
          <span>Web conversation</span>
          <span>•</span>
          <span>Phase 1</span>
        </div>
      </form>

      {error && <div className="alert error">{error}</div>}
    </section>
  )
}
