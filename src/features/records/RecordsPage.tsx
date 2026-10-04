import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/api';
import './records.css';

type RecordKind = 'sale' | 'expense' | 'payment';

type Sale = {
  id: string;
  customer_name: string | null;
  sale_number: string | null;
  status: string;
  sale_date: string;
  total: number;
  notes: string | null;
};

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_status: string;
};

type Transaction = {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
  category: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
};

type TimelineItem = {
  id: string;
  kind: RecordKind;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  direction: 'in' | 'out';
  meta?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Icon({
  name,
  size = 19,
}: {
  name: 'sale' | 'expense' | 'payment' | 'arrow' | 'plus' | 'search';
  size?: number;
}) {
  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
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
    );
  }

  if (name === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <path
          d="M5 12h13M13 7l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'sale') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <path
          d="M4 7.5 7.5 4h9L20 7.5v9L16.5 20h-9L4 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 10h8M8 14h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === 'expense') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <path
          d="M4 7h16v13H4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 7V5h8v2M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RecordIcon({ kind }: { kind: RecordKind }) {
  return (
    <span className={`records-item-icon ${kind}`}>
      <Icon name={kind} size={17} />
    </span>
  );
}

export function RecordsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [kind, setKind] = useState<RecordKind>('sale');
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [salesResult, expensesResult, transactionsResult] =
        await Promise.all([
          supabase
            .from('sales')
            .select(
              'id, customer_name, sale_number, status, sale_date, total, notes',
            )
            .order('sale_date', { ascending: false })
            .limit(50),

          supabase
            .from('expenses')
            .select(
              'id, category, description, amount, expense_date, payment_status',
            )
            .order('expense_date', { ascending: false })
            .limit(50),

          supabase
            .from('transactions')
            .select(
              'id, transaction_type, amount, transaction_date, category, payment_method, reference, notes',
            )
            .order('transaction_date', { ascending: false })
            .limit(50),
        ]);

      if (salesResult.error) throw salesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setSales((salesResult.data ?? []) as Sale[]);
      setExpenses((expensesResult.data ?? []) as Expense[]);
      setTransactions((transactionsResult.data ?? []) as Transaction[]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const timeline = useMemo<TimelineItem[]>(() => {
    const saleItems: TimelineItem[] = sales.map((sale) => ({
      id: `sale-${sale.id}`,
      kind: 'sale',
      title: sale.customer_name || 'Sale recorded',
      subtitle: sale.sale_number || 'Sales record',
      amount: Number(sale.total),
      date: sale.sale_date,
      direction: 'in',
      meta: sale.status,
    }));

    const expenseItems: TimelineItem[] = expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      kind: 'expense',
      title: expense.description,
      subtitle: expense.category,
      amount: Number(expense.amount),
      date: expense.expense_date,
      direction: 'out',
      meta: expense.payment_status,
    }));

    const paymentItems: TimelineItem[] = transactions.map((transaction) => ({
      id: `payment-${transaction.id}`,
      kind: 'payment',
      title: transaction.reference || 'Payment recorded',
      subtitle: transaction.category,
      amount: Number(transaction.amount),
      date: transaction.transaction_date,
      direction:
        transaction.transaction_type === 'income' ? 'in' : 'out',
      meta: transaction.payment_method || transaction.transaction_type,
    }));

    return [...saleItems, ...expenseItems, ...paymentItems].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [sales, expenses, transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return timeline;

    return timeline.filter((item) =>
      [item.title, item.subtitle, item.meta || '', item.kind]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [timeline, search]);

  const totals = useMemo(() => {
    const salesTotal = sales.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );

    const expensesTotal = expenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const income = transactions
      .filter((item) => item.transaction_type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const outgoing = transactions
      .filter((item) => item.transaction_type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      salesTotal,
      expensesTotal,
      income,
      outgoing,
      cashMovement: income - outgoing,
    };
  }, [sales, expenses, transactions]);

  function openCreate(nextKind: RecordKind) {
    setKind(nextKind);
    setError('');
    setOpen(true);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const form = new FormData(e.currentTarget);

      const dateValue = String(form.get('date') || '');
      const date = dateValue
        ? new Date(dateValue).toISOString()
        : new Date().toISOString();

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      if (!userData.user) {
        throw new Error('Session expired. Please sign in again.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      if (kind === 'sale') {
        const customerName =
          String(form.get('customer_name') || '').trim() || null;

        const description = String(
          form.get('description') || '',
        ).trim();

        const quantity = Number(form.get('quantity') || 1);
        const unitPrice = Number(form.get('unit_price') || 0);
        const total = quantity * unitPrice;

        if (!description) {
          throw new Error('Enter what was sold.');
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error('Quantity must be greater than zero.');
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error('Enter a valid selling price.');
        }

        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .insert({
            business_id: profile.business_id,
            customer_name: customerName,
            status: 'completed',
            sale_date: date,
            subtotal: total,
            discount: 0,
            total,
            notes:
              String(form.get('notes') || '').trim() || null,
          })
          .select('id')
          .single();

        if (saleError) throw saleError;

        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            description,
            quantity,
            unit_price: unitPrice,
            line_total: total,
          });

        if (itemError) throw itemError;
      }

      if (kind === 'expense') {
        const amount = Number(form.get('amount') || 0);

        const description = String(
          form.get('description') || '',
        ).trim();

        if (!description) {
          throw new Error('Enter what the expense was for.');
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error(
            'Enter an expense amount greater than zero.',
          );
        }

        const { error } = await supabase.from('expenses').insert({
          business_id: profile.business_id,
          category: String(form.get('category') || 'general'),
          description,
          amount,
          expense_date: date,
          payment_status: String(
            form.get('payment_status') || 'paid',
          ),
          payment_method:
            String(form.get('payment_method') || '').trim() || null,
          notes:
            String(form.get('notes') || '').trim() || null,
        });

        if (error) throw error;
      }

      if (kind === 'payment') {
        const amount = Number(form.get('amount') || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error(
            'Enter a payment amount greater than zero.',
          );
        }

        const { error } = await supabase
          .from('transactions')
          .insert({
            business_id: profile.business_id,
            transaction_type: String(
              form.get('transaction_type') || 'income',
            ),
            amount,
            transaction_date: date,
            category: String(
              form.get('category') || 'general',
            ),
            payment_method:
              String(form.get('payment_method') || '').trim() ||
              null,
            reference:
              String(form.get('reference') || '').trim() || null,
            notes:
              String(form.get('notes') || '').trim() || null,
          });

        if (error) throw error;
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="records-page">
      <header className="records-header">
        <div>
          <span className="eyebrow">BUSINESS RECORDS</span>

          <h1>Know where your money is going.</h1>

          <p>
            Record sales, expenses and payments as they happen.
            Gideon will use this foundation to turn your business
            activity into useful intelligence.
          </p>
        </div>

        <button
          type="button"
          className="primary records-main-action"
          onClick={() => openCreate('sale')}
        >
          <Icon name="plus" size={17} />
          Add record
        </button>
      </header>

      {error && (
        <div className="alert error records-alert">
          {error}
        </div>
      )}

      <section className="records-actions">
        <button
          type="button"
          className="records-action sale"
          onClick={() => openCreate('sale')}
        >
          <RecordIcon kind="sale" />

          <span>
            <strong>Add sale</strong>
            <small>Record something you sold</small>
          </span>

          <Icon name="arrow" size={16} />
        </button>

        <button
          type="button"
          className="records-action expense"
          onClick={() => openCreate('expense')}
        >
          <RecordIcon kind="expense" />

          <span>
            <strong>Add expense</strong>
            <small>Track money spent by the business</small>
          </span>

          <Icon name="arrow" size={16} />
        </button>

        <button
          type="button"
          className="records-action payment"
          onClick={() => openCreate('payment')}
        >
          <RecordIcon kind="payment" />

          <span>
            <strong>Record payment</strong>
            <small>Track money received or paid out</small>
          </span>

          <Icon name="arrow" size={16} />
        </button>
      </section>

      <section className="records-summary">
        <div>
          <span>Sales recorded</span>

          <strong>
            {formatMoney(totals.salesTotal)}
          </strong>

          <small>
            {sales.length} sale{sales.length === 1 ? '' : 's'}
          </small>
        </div>

        <div>
          <span>Expenses recorded</span>

          <strong>
            {formatMoney(totals.expensesTotal)}
          </strong>

          <small>
            {expenses.length} expense
            {expenses.length === 1 ? '' : 's'}
          </small>
        </div>

        <div>
          <span>Cash movement</span>

          <strong
            className={
              totals.cashMovement >= 0
                ? 'positive'
                : 'negative'
            }
          >
            {formatMoney(totals.cashMovement)}
          </strong>

          <small>
            {formatMoney(totals.income)} in ·{' '}
            {formatMoney(totals.outgoing)} out
          </small>
        </div>
      </section>

      <section className="records-list-panel">
        <div className="records-list-head">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h2>Recent business records</h2>
          </div>

          <div className="records-search">
            <Icon name="search" size={16} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
              aria-label="Search business records"
            />
          </div>
        </div>

        {loading ? (
          <div className="records-loading">
            <div className="loader" />
            <span>Loading your records…</span>
          </div>
        ) : !filtered.length ? (
          <div className="records-empty">
            <div className="records-empty-icon">
              <Icon name="sale" size={19} />
            </div>

            <h3>
              {timeline.length
                ? 'No matching records'
                : 'Your records will appear here'}
            </h3>

            <p>
              {timeline.length
                ? 'Try a different search term.'
                : 'Start with a sale, expense or payment. You can build the rest of your business intelligence from there.'}
            </p>

            {!timeline.length && (
              <button
                type="button"
                className="secondary"
                onClick={() => openCreate('sale')}
              >
                Add your first sale
              </button>
            )}
          </div>
        ) : (
          <div className="records-list">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="records-row"
              >
                <RecordIcon kind={item.kind} />

                <div className="records-row-copy">
                  <strong>{item.title}</strong>

                  <span>{item.subtitle}</span>

                  <small>
                    {formatDate(item.date)}

                    {item.meta ? (
                      <em> · {item.meta}</em>
                    ) : null}
                  </small>
                </div>

                <strong
                  className={`records-amount ${item.direction}`}
                >
                  {item.direction === 'in' ? '+' : '-'}
                  {formatMoney(item.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div
          className="modal-backdrop records-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !busy
            ) {
              setOpen(false);
            }
          }}
        >
          <form
            className="modal records-modal"
            onSubmit={save}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  BUSINESS RECORD
                </span>

                <h2>
                  {kind === 'sale'
                    ? 'Add a sale'
                    : kind === 'expense'
                    ? 'Add an expense'
                    : 'Record a payment'}
                </h2>

                <p>
                  Keep the entry simple now. Gideon can
                  build deeper analysis as your records
                  grow.
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

            {kind === 'sale' && (
              <>
                <div className="records-form-grid">
                  <label>
 
