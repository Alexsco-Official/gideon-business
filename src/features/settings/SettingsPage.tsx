import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  getCurrentContext,
  errorMessage,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui'
import type { Business } from '../../types/database'

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20M15 9h2.5A1.5 1.5 0 0 1 19 10.5V20M3 20h18M8 8h3M8 11h3M8 14h3M8 17h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m6 12 4 4 8-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m19.2 13.3 1.2.9-1.8 3.1-1.4-.6a8 8 0 0 1-2.1 1.2l-.2 1.5h-3.6l-.2-1.5a8 8 0 0 1-2.1-1.2l-1.4.6-1.8-3.1 1.2-.9a7.8 7.8 0 0 1 0-2.6l-1.2-.9 1.8-3.1 1.4.6a8 8 0 0 1 2.1-1.2l.2-1.5h3.6l.2 1.5a8 8 0 0 1 2.1 1.2l1.4-.6 1.8 3.1-1.2.9a7.8 7.8 0 0 1 0 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsPage() {
  const [business, setBusiness] =
    useState<Business | null>(null)

  const [accountEmail, setAccountEmail] =
    useState('')

  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const context = await getCurrentContext()

      setBusiness(context?.business ?? null)

      const user = await supabase.auth.getUser()

      setAccountEmail(
        user.data.user?.email ?? '',
      )
    }

    load().catch((e) =>
      setError(errorMessage(e)),
    )
  }, [])

  async function save(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault()

    if (!business) return

    setBusy(true)
    setSaved(false)
    setError('')

    const form = new FormData(e.currentTarget)

    const payload = {
      name: String(form.get('name') || ''),
      description:
        String(form.get('description') || '') ||
        null,
      industry:
        String(form.get('industry') || '') ||
        null,
      phone:
        String(form.get('phone') || '') ||
        null,
      email:
        String(form.get('email') || '') ||
        null,
    }

    try {
      const { data, error } =
        await supabase
          .from('businesses')
          .update(payload)
          .eq('id', business.id)
          .select()
          .single()

      if (error) throw error

      setBusiness(data as Business)
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!business) {
    return (
      <div>
        {error ? (
          <div className="alert error">
            {error}
          </div>
        ) : (
          <div className="loader" />
        )}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="SETTINGS"
        title="Business settings"
        text="Keep Gideon's operating profile accurate as your business grows."
      />

      {error && (
        <div className="alert error settings-alert">
          {error}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-side">
          <div className="settings-identity">
            <div className="settings-business-icon">
              <BuildingIcon />
            </div>

            <div>
              <strong>{business.name}</strong>
              <span>
                {business.industry ||
                  'Business workspace'}
              </span>
            </div>
          </div>

          <div className="settings-side-item active">
            <SettingsIcon />
            <div>
              <strong>Business profile</strong>
              <span>Core operating information</span>
            </div>
          </div>

          <div className="settings-side-item">
            <CheckIcon />
            <div>
              <strong>Foundation ready</strong>
              <span>
                Authentication & workspace connected
              </span>
            </div>
          </div>
        </aside>

        <main className="settings-main">
          <section className="settings-section">
            <div className="settings-section-head">
              <div>
                <span className="eyebrow">
                  BUSINESS PROFILE
                </span>

                <h2>Business information</h2>

                <p>
                  This information helps keep your
                  workspace and future AI features
                  grounded in the right business context.
                </p>
              </div>
            </div>

            <form
              className="settings-form"
              onSubmit={save}
            >
              <div className="settings-form-grid">
                <label>
                  Business name

                  <input
                    name="name"
                    defaultValue={business.name}
                    required
                    placeholder="Your business name"
                  />
                </label>

                <label>
                  Industry

                  <input
                    name="industry"
                    defaultValue={
                      business.industry ?? ''
                    }
                    placeholder="e.g. Solar & Electrical"
                  />
                </label>

                <label>
                  Business phone

                  <input
                    name="phone"
                    type="tel"
                    defaultValue={
                      business.phone ?? ''
                    }
                    placeholder="+234..."
                  />
                </label>

                <label>
                  Business email

                  <input
                    name="email"
                    type="email"
                    defaultValue={
                      business.email ?? ''
                    }
                    placeholder="business@example.com"
                  />
                </label>
              </div>

              <label>
                Business description

                <textarea
                  name="description"
                  rows={6}
                  defaultValue={
                    business.description ?? ''
                  }
                  placeholder="Tell Gideon what this business does, who it serves and what makes it useful..."
                />
              </label>

              <div className="settings-save-row">
                {saved && (
                  <div className="settings-saved">
                    <CheckIcon />
                    Changes saved
                  </div>
                )}

                <button
                  className="primary"
                  disabled={busy}
                >
                  {busy
                    ? 'Saving…'
                    : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section settings-account">
            <div className="settings-section-head">
              <div>
                <span className="eyebrow">
                  ACCOUNT
                </span>

                <h2>Account access</h2>

                <p>
                  Your authenticated account is connected
                  to this business workspace.
                </p>
              </div>
            </div>

            <div className="settings-account-row">
              <div className="settings-account-icon">
                <span>
                  {accountEmail
                    ? accountEmail
                        .charAt(0)
                        .toUpperCase()
                    : 'A'}
                </span>
              </div>

              <div>
                <strong>
                  {accountEmail || 'Authenticated user'}
                </strong>

                <span>
                  Workspace account
                </span>
              </div>

              <span className="settings-connected">
                <span />
                Connected
              </span>
            </div>
          </section>

          <section className="settings-future">
            <div className="settings-future-mark">
              <BuildingIcon />
            </div>

            <div>
              <span className="eyebrow">
                GIDEON FOUNDATION
              </span>

              <h3>
                Your business profile is the context
                layer.
              </h3>

              <p>
                Business intelligence, document
                processing and AI assistance will build
                on this foundation rather than operating
                as disconnected features.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
