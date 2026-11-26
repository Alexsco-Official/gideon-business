import { ReactNode } from 'react';

import './skeleton.css';

// Building blocks ------------------------------------------------------

export function Bone({
  width = '100%',
  height = 12,
  radius,
  className = '',
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}) {
  return (
    <span
      className={`sk ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

// Wraps a whole loading outline so screen readers hear "Loading" once.
export function LoadingRegion({
  label = 'Loading',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="sk-page"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function HeaderSkeleton({
  actions = 1,
}: {
  actions?: number;
}) {
  return (
    <div className="sk-header">
      <div className="sk-header-text">
        <Bone width={190} height={28} />
        <Bone width="min(420px, 80%)" height={13} />
      </div>

      {Array.from({ length: actions }).map((_, i) => (
        <Bone
          key={i}
          className="sk-action"
          width={132}
          height={42}
          radius={10}
        />
      ))}
    </div>
  );
}

export function StatCardsSkeleton({
  count = 3,
}: {
  count?: number;
}) {
  return (
    <div className={count === 4 ? 'sk-stats four' : 'sk-stats'}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="sk-card" key={i}>
          <Bone width={110} height={12} />
          <Bone width={130} height={28} />
          <Bone width={90} height={11} />
        </div>
      ))}
    </div>
  );
}

export function ToolbarSkeleton({
  tabs = 0,
}: {
  tabs?: number;
}) {
  return (
    <>
      {tabs > 0 && (
        <div className="sk-tabs">
          {Array.from({ length: tabs }).map((_, i) => (
            <Bone key={i} />
          ))}
        </div>
      )}

      <div className="sk-toolbar">
        <Bone height={44} radius={10} className="sk-search" />
        <Bone width={92} height={44} radius={10} />
      </div>
    </>
  );
}

// Rows with a small icon, two lines of text and a value on the right.
export function ListRowsSkeleton({
  rows = 5,
  withPanel = true,
}: {
  rows?: number;
  withPanel?: boolean;
}) {
  const body = Array.from({ length: rows }).map((_, i) => (
    <div className="sk-row" key={i}>
      <Bone width={40} height={40} radius={11} />

      <div className="sk-row-text">
        <Bone width="46%" height={13} />
        <Bone width="30%" height={11} />
      </div>

      <Bone width={84} height={14} />
    </div>
  ));

  return withPanel ? (
    <div className="sk-panel">{body}</div>
  ) : (
    <>{body}</>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  withPanel = true,
}: {
  rows?: number;
  cols?: number;
  withPanel?: boolean;
}) {
  const template = {
    gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`,
  };

  const body = (
    <>
      <div className="sk-table-row head" style={template}>
        {Array.from({ length: cols }).map((_, c) => (
          <Bone
            key={c}
            width={c === 0 ? 90 : 60}
            height={10}
            className={c > 2 ? 'hide-small' : ''}
          />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div className="sk-table-row" style={template} key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Bone
              key={c}
              width={c === 0 ? '70%' : '55%'}
              height={13}
              className={c > 2 ? 'hide-small' : ''}
            />
          ))}
        </div>
      ))}
    </>
  );

  return withPanel ? <div className="sk-panel">{body}</div> : body;
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 2 | 3;
}) {
  return (
    <div className={`sk-grid cols-${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="sk-card" key={i}>
          <div className="sk-row" style={{ padding: 0, border: 0 }}>
            <Bone width={44} height={44} radius={12} />

            <div className="sk-row-text">
              <Bone width="55%" height={14} />
              <Bone width="35%" height={11} />
            </div>
          </div>

          <Bone width="80%" height={11} />
          <Bone width="60%" height={11} />
        </div>
      ))}
    </div>
  );
}

// Whole-page outlines -------------------------------------------------

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard">
      <HeaderSkeleton actions={0} />
      <StatCardsSkeleton count={3} />

      <div className="sk-main-grid">
        <div className="sk-panel">
          <div className="sk-panel-head">
            <Bone width={150} height={16} />
          </div>
          <ListRowsSkeleton rows={4} withPanel={false} />
        </div>

        <div className="sk-card">
          <Bone width={140} height={16} />
          <Bone width="90%" height={12} />
          <Bone width="100%" height={40} radius={10} />
          <Bone width="100%" height={40} radius={10} />
          <Bone width="100%" height={40} radius={10} />
        </div>
      </div>
    </LoadingRegion>
  );
}

export function RecordsSkeleton() {
  return (
    <LoadingRegion label="Loading records">
      <HeaderSkeleton actions={3} />
      <StatCardsSkeleton count={3} />
      <ToolbarSkeleton />
      <ListRowsSkeleton rows={6} />
    </LoadingRegion>
  );
}

export function ProductsSkeleton() {
  return (
    <LoadingRegion label="Loading products">
      <HeaderSkeleton />
      <ToolbarSkeleton tabs={3} />
      <CardGridSkeleton count={6} columns={3} />
    </LoadingRegion>
  );
}

export function InventorySkeleton() {
  return (
    <LoadingRegion label="Loading inventory">
      <HeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <ToolbarSkeleton />
      <TableSkeleton rows={5} cols={5} />
    </LoadingRegion>
  );
}

export function LeadsSkeleton() {
  return (
    <LoadingRegion label="Loading leads">
      <HeaderSkeleton />
      <ToolbarSkeleton tabs={5} />
      <CardGridSkeleton count={6} columns={3} />
    </LoadingRegion>
  );
}

export function ConversationsSkeleton() {
  return (
    <LoadingRegion label="Loading conversations">
      <HeaderSkeleton />
      <ToolbarSkeleton />
      <ListRowsSkeleton rows={5} />
    </LoadingRegion>
  );
}

export function KnowledgeSkeleton() {
  return (
    <LoadingRegion label="Loading knowledge">
      <HeaderSkeleton actions={2} />
      <ToolbarSkeleton tabs={4} />
      <ListRowsSkeleton rows={5} />
    </LoadingRegion>
  );
}

export function SettingsSkeleton() {
  return (
    <LoadingRegion label="Loading settings">
      <HeaderSkeleton actions={0} />

      <div className="sk-form">
        <div className="sk-card">
          <Bone width={160} height={16} />

          {[0, 1, 2, 3].map((i) => (
            <div className="sk-field" key={i}>
              <Bone width={110} height={11} />
              <Bone height={44} radius={10} />
            </div>
          ))}

          <Bone width={140} height={42} radius={10} />
        </div>
      </div>
    </LoadingRegion>
  );
}

// Picks the outline that matches the page being opened ----------------

export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/leads')) return <LeadsSkeleton />;
  if (pathname.startsWith('/conversations')) return <ConversationsSkeleton />;
  if (pathname.startsWith('/knowledge')) return <KnowledgeSkeleton />;
  if (pathname.startsWith('/records')) return <RecordsSkeleton />;
  if (pathname.startsWith('/products')) return <ProductsSkeleton />;
  if (pathname.startsWith('/inventory')) return <InventorySkeleton />;
  if (pathname.startsWith('/settings')) return <SettingsSkeleton />;

  return <DashboardSkeleton />;
}
