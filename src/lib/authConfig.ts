// Settings shared by the sign-in pages.

// New passwords must be at least this long. Existing accounts keep working,
// so the sign-in form does not enforce it.
export const MIN_PASSWORD_LENGTH = 8;

// Where links in emails (confirm account, reset password) send people back to.
// Set VITE_SITE_URL in Netlify to force one address. Without it, the address
// the person is using right now is used, so deploy previews and local
// development also work. Every address used here must also be listed under
// Authentication > URL Configuration in Supabase.
export function siteUrl(): string {
  const configured: unknown = import.meta.env.VITE_SITE_URL;

  const base =
    typeof configured === 'string' && configured.trim()
      ? configured.trim()
      : window.location.origin;

  return base.replace(/\/+$/, '');
}
