import { FormEvent, useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/api';
import { useAuth } from './AuthContext';

function AuthCard({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (auth.loading) {
    return (
      <main className="center">
        <div className="loader" />
      </main>
    );
  }

  if (auth.session) {
    return <NavigateByProfile />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo:
              'https://gideon-business.netlify.app/login',
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate('/onboarding');
        } else {
          setNotice(
            'Account created. Check your email to confirm your account, then sign in.'
          );
        }
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';

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
        <span className="eyebrow">
          BUSINESS OPERATING SYSTEM
        </span>

        <h1>
          {isLogin ? 'Welcome back' : 'Start your workspace'}
        </h1>

        <p className="muted">
          Run customer enquiries, leads, knowledge and
          conversations from one place.
        </p>

        <form onSubmit={submit}>
          {!isLogin && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

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

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={
                isLogin
                  ? 'current-password'
                  : 'new-password'
              }
            />
          </label>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {notice && (
            <div className="alert">
              {notice}
            </div>
          )}

          <button
            className="primary"
            disabled={busy}
            type="submit"
          >
            {busy
              ? 'Working…'
              : isLogin
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? (
            <>
              New to Gideon?{' '}
              <Link to="/signup">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login">
                Sign in
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

function NavigateByProfile() {
  const { hasProfile } = useAuth();

  return hasProfile ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/onboarding" replace />
  );
}

export function LoginPage() {
  return <AuthCard mode="login" />;
}

export function SignupPage() {
  return <AuthCard mode="signup" />;
}
