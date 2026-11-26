import { FormEvent, ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/api';
import {
  MIN_PASSWORD_LENGTH,
  siteUrl,
} from '../../lib/authConfig';
import { useAuth } from './AuthContext';

function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark">G</span>

        <div>
          <strong>Gideon Business</strong>
          <small>by Alexsco Technologies</small>
        </div>
      </div>

      <section className="auth-card">
        <h1>{title}</h1>

        <p className="muted">{intro}</p>

        {children}
      </section>
    </main>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${siteUrl()}/reset-password`,
          },
        );

      if (error) {
        throw error;
      }

      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      intro="Enter the email you signed up with and we will send you a link to choose a new password."
    >
      {sent ? (
        <>
          <div className="alert" style={{ marginTop: 26 }}>
            If an account exists for that email, a reset link
            is on its way. Check your inbox and your spam
            folder. The link works once and expires after a
            short time.
          </div>

          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            {error && (
              <div className="alert error">{error}</div>
            )}

            <button
              className="primary"
              disabled={busy}
              type="submit"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (auth.loading) {
    return (
      <main className="center">
        <div className="loader" />
      </main>
    );
  }

  // The email link signs the person in for a short time. Without it the
  // link was already used or has expired.
  if (!auth.session) {
    return (
      <AuthShell
        title="This link has expired"
        intro="Reset links work once and expire after a short time. Request a new one to continue."
      >
        <p className="auth-switch">
          <Link to="/forgot-password">
            Request a new link
          </Link>
        </p>
      </AuthShell>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
      );
      return;
    }

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      // Sign out every other device that was using the old password.
      await supabase.auth
        .signOut({ scope: 'others' })
        .catch(() => undefined);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      intro={`Use at least ${MIN_PASSWORD_LENGTH} characters. Other devices signed in with your old password will be signed out.`}
    >
      <form onSubmit={submit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        <button
          className="primary"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
}
