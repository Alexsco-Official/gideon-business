import { ReactNode } from 'react';

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">+</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

// The standard page header used across the app: the page name (the same
// as its menu item), one plain line of description, and the main action
// on the right.
export function PageHeader({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
  // Older pages still pass this. It is intentionally not shown.
  eyebrow?: string;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {text && <p className="muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}
