import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { errorMessage, getCurrentContext } from '../../lib/api';
import { supabase } from '../../lib/supabase';

import './inventory.css';

type Product = {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  unit: string;
  cost_price: number;
  active: boolean;
  track_inventory: boolean;
  item_type: 'product' | 'service';
};

type MovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment_in'
  | 'adjustment_out';

type InventoryMovement = {
  id: string;
  business_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number;
  movement_date: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

type MovementForm = {
  product_id: string;
  movement_type: 'purchase' | 'adjustment_in' | 'adjustment_out';
  quantity: string;
  unit_cost: string;
  movement_date: string;
  reference: string;
  notes: string;
};

const PAGE_SIZE = 500;
const HISTORY_SIZE = 100;

function todayInputValue() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createEmptyForm(): MovementForm {
  return {
    product_id: '',
    movement_type: 'purchase',
    quantity: '',
    unit_cost: '',
    movement_date: todayInputValue(),
    reference: '',
    notes: '',
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function movementLabel(type: MovementType) {
  const labels: Record<MovementType, string> = {
    purchase: 'Stock received',
    sale: 'Stock sold',
    return: 'Customer return',
    adjustment_in: 'Stock increase',
    adjustment_out: 'Stock decrease',
  };

  return labels[type];
}

function movementSign(type: MovementType) {
  return type === 'purchase' ||
    type === 'return' ||
    type === 'adjustment_in'
    ? 1
    : -1;
}

function MovementIcon({
  name,
  size = 20,
}: {
  name: 'box' | 'plus' | 'history' | 'search';
  size?: number;
}) {
  if (name === 'plus') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="10.8"
          cy="10.8"
          r="6.8"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m16 16 4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === 'history') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.5 11a8.5 8.5 0 1 1 2.4 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3.5 5.5V11h5.5M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InventoryPage() {
  const [businessId, setBusinessId] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<
    'all' | 'in' | 'out'
  >('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MovementForm>(createEmptyForm);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function fetchAllMovements(
    currentBusinessId: string,
  ): Promise<InventoryMovement[]> {
    const allMovements: InventoryMovement[] = [];

    let offset = 0;

    while (true) {
      const { data, error: fetchError } = await supabase
        .from('inventory_movements')
        .select(
          'id, business_id, product_id, movement_type, quantity, unit_cost, movement_date, reference, notes, created_at',
        )
        .eq('business_id', currentBusinessId)
        .order('movement_date', { ascending: false })
        .order('id', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        throw fetchError;
      }

      const batch = (data || []) as InventoryMovement[];

      allMovements.push(...batch);

      if (batch.length < PAGE_SIZE) {
        break;
      }

      offset += PAGE_SIZE;
    }

    return allMovements;
  }

  async function loadInventory() {
    setLoading(true);
    setError('');

    try {
      const context = await getCurrentContext();

      if (!context?.business?.id) {
        throw new Error(
          'Your business workspace could not be found.',
        );
      }

      const currentBusinessId = context.business.id;

      setBusinessId(currentBusinessId);

      const [productResult, movementResult] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, business_id, name, sku, unit, cost_price, active, track_inventory, item_type',
          )
          .eq('business_id', currentBusinessId)
          .eq('track_inventory', true)
          .eq('item_type', 'product')
          .order('name', { ascending: true }),

        fetchAllMovements(currentBusinessId),
      ]);

      if (productResult.error) {
        throw productResult.error;
      }

      setProducts((productResult.data || []) as Product[]);
      setMovements(movementResult);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, []);

  /*
   * Stock is calculated from every fetched movement.
   *
   * Increases:
   * purchase, return, adjustment_in
   *
   * Decreases:
   * sale, adjustment_out
   */
  const stockByProduct = useMemo(() => {
    const stock: Record<string, number> = {};

    for (const product of products) {
      stock[product.id] = 0;
    }

    for (const movement of movements) {
      if (stock[movement.product_id] === undefined) {
        continue;
      }

      stock[movement.product_id] +=
        movementSign(movement.movement_type) *
        Number(movement.quantity);
    }

    return stock;
  }, [products, movements]);

  const productById = useMemo(() => {
    const lookup: Record<string, Product> = {};

    for (const product of products) {
      lookup[product.id] = product;
    }

    return lookup;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        (product.sku || '').toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const visibleMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements
      .filter((movement) => {
        const product = productById[movement.product_id];

        const matchesSearch =
          !query ||
          (product?.name || '').toLowerCase().includes(query) ||
          (movement.reference || '').toLowerCase().includes(query) ||
          (movement.notes || '').toLowerCase().includes(query);

        const isIncoming = movementSign(
          movement.movement_type,
        ) === 1;

        const matchesDirection =
          movementFilter === 'all' ||
          (movementFilter === 'in' && isIncoming) ||
          (movementFilter === 'out' && !isIncoming);

        return matchesSearch && matchesDirection;
      })
      .slice(0, HISTORY_SIZE);
  }, [movements, productById, search, movementFilter]);

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, product) => sum + (stockByProduct[product.id] || 0),
      0,
    );

    const outOfStock = products.filter(
      (product) => (stockByProduct[product.id] || 0) <= 0,
    ).length;

    const negativeStock = products.filter(
      (product) => (stockByProduct[product.id] || 0) < 0,
    ).length;

    const activeTracked = products.filter(
      (product) => product.active,
    ).length;

    return {
      products: products.length,
      activeTracked,
      totalUnits,
      outOfStock,
      negativeStock,
    };
  }, [products, stockByProduct]);

  function openMovementForm() {
    setError('');
    setNotice('');

    const firstActiveProduct = products.find(
      (product) => product.active,
    );

    setForm({
      ...createEmptyForm(),
      product_id: firstActiveProduct?.id || '',
    });

    setModalOpen(true);
  }

  function closeMovementForm() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setForm(createEmptyForm());
    setError('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setNotice('');

    if (!businessId) {
      setError('Your business workspace could not be found.');
      return;
    }

    const product = productById[form.product_id];

    if (!product) {
      setError('Select a valid inventory product.');
      return;
    }

    if (!product.active) {
      setError(
        'This product is inactive. Activate it in Products before recording a new movement.',
      );
      return;
    }

    const quantity = Number(form.quantity);
    const unitCost = Number(form.unit_cost || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError('Enter a valid unit cost.');
      return;
    }

    if (!form.movement_date) {
      setError('Select the movement date.');
      return;
    }

    const movementDate = new Date(
      `${form.movement_date}T12:00:00`,
    );

    if (Number.isNaN(movementDate.getTime())) {
      setError('The movement date is invalid.');
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from('inventory_movements')
        .insert({
          business_id: businessId,
          product_id: product.id,
          movement_type: form.movement_type,
          quantity,
          unit_cost: unitCost,
          movement_date: movementDate.toISOString(),
          reference: form.reference.trim() || null,
          notes: form.notes.trim() || null,
        });

      if (insertError) {
        throw insertError;
      }

      setModalOpen(false);
      setForm(createEmptyForm());
      setNotice('Inventory movement recorded successfully.');

      await loadInventory();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="inventory-page">
      <header className="inventory-header">
        <div>
          <span className="inventory-eyebrow">
            STOCK CONTROL
          </span>

          <h1>Inventory</h1>

          <p>
            Track stock received, adjustments and movement
            history across your inventory-managed products.
          </p>
        </div>

        <button
          className="inventory-primary-button"
          type="button"
          onClick={openMovementForm}
          disabled={products.filter((item) => item.active).length === 0}
        >
          <MovementIcon name="plus" size={18} />
          Record movement
        </button>
      </header>

      {error && !modalOpen && (
        <div className="inventory-alert" role="alert">
          {error}
        </div>
      )}

      {notice && !modalOpen && (
        <div className="inventory-notice" role="status">
          {notice}
        </div>
      )}

      <div className="inventory-stats">
        <article className="inventory-stat">
          <div className="inventory-stat-icon">
            <MovementIcon name="box" />
          </div>

          <div>
            <span>Tracked products</span>
            <strong>{stats.products}</strong>
            <small>{stats.activeTracked} active</small>
          </div>
        </article>

        <article className="inventory-stat">
          <div className="inventory-stat-icon">
            <MovementIcon name="history" />
          </div>

          <div>
            <span>Total stock units</span>
            <strong>{formatQuantity(stats.totalUnits)}</strong>
            <small>Across tracked products</small>
          </div>
        </article>

        <article className="inventory-stat">
          <div className="inventory-stat-icon warning">
            <MovementIcon name="box" />
          </div>

          <div>
            <span>Out of stock</span>
            <strong>{stats.outOfStock}</strong>
            <small>Products at zero or below</small>
          </div>
        </article>

        <article className="inventory-stat">
          <div className="inventory-stat-icon danger">
            <MovementIcon name="box" />
          </div>

          <div>
            <span>Negative stock</span>
            <strong>{stats.negativeStock}</strong>
            <small>Records needing review</small>
          </div>
        </article>
      </div>

      <div className="inventory-toolbar">
        <label className="inventory-search">
          <MovementIcon name="search" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, SKU or movement notes..."
            aria-label="Search inventory"
          />
        </label>

        <button
          type="button"
          className="inventory-secondary-button"
          onClick={() => void loadInventory()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Stock levels</h2>
            <p>
              Quantities are calculated from recorded stock movements.
            </p>
          </div>

          <span className="inventory-count">
            {filteredProducts.length} products
          </span>
        </div>

        {loading ? (
          <div className="inventory-empty">
            <div className="inventory-loader" />
            <p>Calculating stock levels…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="inventory-empty">
            <div className="inventory-empty-icon">
              <MovementIcon name="box" size={26} />
            </div>

            <h3>No inventory products yet</h3>

            <p>
              Add a product in Products and enable inventory tracking
              to manage its stock here.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="inventory-empty">
            <h3>No matching products</h3>
            <p>Try a different product name or SKU.</p>
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current stock</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const stock = stockByProduct[product.id] || 0;

                  const stockStatus =
                    stock < 0
                      ? 'negative'
                      : stock === 0
                        ? 'empty'
                        : 'available';

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="inventory-product-name">
                          <span className="inventory-product-icon">
                            <MovementIcon name="box" size={17} />
                          </span>

                          <div>
                            <strong>{product.name}</strong>

                            {!product.active && (
                              <small>Inactive product</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{product.sku || '—'}</td>

                      <td>
                        <strong
                          className={
                            stock < 0
                              ? 'inventory-quantity negative'
                              : 'inventory-quantity'
                          }
                        >
                          {formatQuantity(stock)}
                        </strong>
                      </td>

                      <td>{product.unit || 'unit'}</td>

                      <td>
                        <span
                          className={`inventory-status ${stockStatus}`}
                        >
                          {stock < 0
                            ? 'Negative'
                            : stock === 0
                              ? 'Out of stock'
                              : 'In stock'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="inventory-row-button"
                          onClick={() => {
                            setForm({
                              ...createEmptyForm(),
                              product_id: product.id,
                            });

                            setError('');
                            setNotice('');
                            setModalOpen(true);
                          }}
                          disabled={!product.active}
                        >
                          Update stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="inventory-panel inventory-history-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Movement history</h2>
            <p>
              The latest 100 matching records are displayed.
            </p>
          </div>

          <select
            className="inventory-filter"
            value={movementFilter}
            onChange={(event) =>
              setMovementFilter(
                event.target.value as 'all' | 'in' | 'out',
              )
            }
            aria-label="Filter movement direction"
          >
            <option value="all">All movements</option>
            <option value="in">Stock increases</option>
            <option value="out">Stock decreases</option>
          </select>
        </div>

        {loading ? (
          <div className="inventory-empty">
            <p>Loading movement history…</p>
          </div>
        ) : visibleMovements.length === 0 ? (
          <div className="inventory-empty">
            <div className="inventory-empty-icon">
              <MovementIcon name="history" size={26} />
            </div>

            <h3>No movements recorded</h3>

            <p>
              Record a stock receipt or adjustment to start building
              your inventory history.
            </p>
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Movement</th>
                  <th>Quantity</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>
                {visibleMovements.map((movement) => {
                  const incoming =
                    movementSign(movement.movement_type) === 1;

                  const product =
                    productById[movement.product_id];

                  return (
                    <tr key={movement.id}>
                      <td>{formatDate(movement.movement_date)}</td>

                      <td>
                        <strong>
                          {product?.name || 'Unknown product'}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            incoming
                              ? 'inventory-movement-type incoming'
                              : 'inventory-movement-type outgoing'
                          }
                        >
                          {movementLabel(movement.movement_type)}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={
                            incoming
                              ? 'inventory-quantity positive'
                              : 'inventory-quantity negative'
                          }
                        >
                          {incoming ? '+' : '−'}
                          {formatQuantity(Number(movement.quantity))}
                        </strong>
                      </td>

                      <td>
                        <span className="inventory-reference">
                          {movement.reference || movement.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMovementForm();
            }
          }}
        >
          <section
            className="inventory-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div className="inventory-modal-heading">
              <div>
                <span className="inventory-eyebrow">
                  STOCK CONTROL
                </span>

                <h2 id="inventory-modal-title">
                  Record inventory movement
                </h2>

                <p>
                  Record stock received or correct a stock balance.
                </p>
              </div>

              <button
                type="button"
                className="inventory-close"
                onClick={closeMovementForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="inventory-alert" role="alert">
                {error}
              </div>
            )}

            <form
              className="inventory-form"
              onSubmit={handleSubmit}
            >
              <label>
                Product
                <select
                  value={form.product_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      product_id: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select a product</option>

                  {products
                    .filter((product) => product.active)
                    .map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                        {product.sku ? ` (${product.sku})` : ''}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Movement type
                <select
                  value={form.movement_type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      movement_type: event.target.value as
                        | 'purchase'
                        | 'adjustment_in'
                        | 'adjustment_out',
                    })
                  }
                  required
                >
                  <option value="purchase">
                    Stock received / purchase
                  </option>

                  <option value="adjustment_in">
                    Increase stock
                  </option>

                  <option value="adjustment_out">
                    Decrease stock
                  </option>
                </select>
              </label>

              <div className="inventory-form-grid">
                <label>
                  Quantity
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        quantity: event.target.value,
                      })
                    }
                    placeholder="e.g. 10"
                    required
                  />
                </label>

                <label>
                  Unit cost (₦)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.unit_cost}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        unit_cost: event.target.value,
                      })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label>
                Movement date
                <input
                  type="date"
                  value={form.movement_date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      movement_date: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Reference
                <input
                  type="text"
                  value={form.reference}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reference: event.target.value,
                    })
                  }
                  placeholder="Receipt number or reference"
                  maxLength={120}
                />
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional details about this movement"
                  rows={3}
                  maxLength={1000}
                />
              </label>

              <div className="inventory-form-actions">
                <button
                  type="button"
                  className="inventory-secondary-button"
                  onClick={closeMovementForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inventory-primary-button"
                  disabled={saving || products.length === 0}
                >
                  {saving ? 'Saving movement…' : 'Save movement'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
