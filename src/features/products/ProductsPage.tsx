import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../../lib/supabase';
import {
  errorMessage,
  getCurrentContext,
} from '../../lib/api';
import './products.css';

type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  item_type: 'product' | 'service';
  sku: string | null;
  unit: string;
  selling_price: number;
  cost_price: number;
  track_inventory: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  description: string;
  item_type: 'product' | 'service';
  sku: string;
  unit: string;
  selling_price: string;
  cost_price: string;
  track_inventory: boolean;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  item_type: 'product',
  sku: '',
  unit: 'unit',
  selling_price: '',
  cost_price: '',
  track_inventory: false,
};

export function ProductsPage() {
  const [businessId, setBusinessId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'product' | 'service'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('active');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const context = await getCurrentContext();

      if (!context?.business) {
        throw new Error(
          'Your business workspace could not be found.'
        );
      }

      setBusinessId(context.business.id);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', context.business.id)
        .order('active', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProducts((data || []) as Product[]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'all' ||
        product.item_type === typeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.active) ||
        (statusFilter === 'inactive' && !product.active);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    typeFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const active = products.filter(
      (product) => product.active
    ).length;

    const tracked = products.filter(
      (product) =>
        product.active &&
        product.item_type === 'product' &&
        product.track_inventory
    ).length;

    const services = products.filter(
      (product) =>
        product.active &&
        product.item_type === 'service'
    ).length;

    return {
      total: products.length,
      active,
      tracked,
      services,
    };
  }, [products]);

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description || '',
      item_type: product.item_type,
      sku: product.sku || '',
      unit: product.unit,
      selling_price: String(product.selling_price),
      cost_price: String(product.cost_price),
      track_inventory: product.track_inventory,
    });

    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!businessId) {
      setError('Business workspace not found.');
      return;
    }

    if (!form.name.trim()) {
      setError('Please enter a product or service name.');
      return;
    }

    const sellingPrice =
      Number(form.selling_price);

    const costPrice =
      Number(form.cost_price || 0);

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      setError('Enter a valid selling price.');
      return;
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      setError('Enter a valid cost price.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        business_id: businessId,
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        item_type: form.item_type,
        sku: form.sku.trim() || null,
        unit: form.unit.trim() || 'unit',
        selling_price: sellingPrice,
        cost_price: costPrice,
        track_inventory:
          form.item_type === 'product'
            ? form.track_inventory
            : false,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error: updateError } =
          await supabase
            .from('products')
            .update(payload)
            .eq('id', editingProduct.id)
            .eq('business_id', businessId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } =
          await supabase
            .from('products')
            .insert(payload);

        if (insertError) {
          throw insertError;
        }
      }

      closeModal();
      await loadProducts();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    setError('');

    try {
      const { error: updateError } =
        await supabase
          .from('products')
          .update({
            active: !product.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .eq('business_id', businessId);

      if (updateError) {
        throw updateError;
      }

      await loadProducts();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      'en-NG',
      {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  return (
    <section className="products-page">
      <div className="products-header">
        <div>
          <span className="products-eyebrow">
            BUSINESS CATALOG
          </span>

          <h1>Products & Services</h1>

          <p>
            Keep your products and services organized
            so Gideon can understand what your business
            sells.
          </p>
        </div>

        <button
          className="products-primary-button"
          type="button"
          onClick={openCreate}
        >
          <PlusIcon />
          Add item
        </button>
      </div>

      {error && !modalOpen && (
        <div className="products-alert">
          {error}
        </div>
      )}

      <div className="products-stats">
        <StatCard
          label="Total items"
          value={stats.total}
          icon={<BoxIcon />}
        />

        <StatCard
          label="Active"
          value={stats.active}
          icon={<CheckIcon />}
        />

        <StatCard
          label="Inventory tracked"
          value={stats.tracked}
          icon={<InventoryIcon />}
        />

        <StatCard
          label="Services"
          value={stats.services}
          icon={<ServiceIcon />}
        />
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <SearchIcon />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products, services or SKU..."
          />
        </div>

        <div className="products-filters">
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | 'all'
                  | 'product'
                  | 'service'
              )
            }
          >
            <option value="all">All types</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | 'active'
                  | 'inactive'
              )
            }
          >
            <option value="active">Active</option>
            <option value="all">All statuses</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="products-list">
        {loading ? (
          <div className="products-loading">
            <div className="products-loader" />
            <span>Loading your catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="products-empty">
            <div className="products-empty-icon">
              <BoxIcon size={26} />
            </div>

            <h2>
              {products.length === 0
                ? 'Your catalog is empty'
                : 'No matching items'}
            </h2>

            <p>
              {products.length === 0
                ? 'Add the products or services your business sells.'
                : 'Try changing your search or filters.'}
            </p>

            {products.length === 0 && (
              <button
                className="products-primary-button"
                type="button"
                onClick={openCreate}
              >
                <PlusIcon />
                Add your first item
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article
                className={
                  product.active
                    ? 'product-card'
                    : 'product-card inactive'
                }
                key={product.id}
              >
                <div className="product-card-top">
                  <div className="product-type-icon">
                    {product.item_type ===
                    'product' ? (
                      <BoxIcon />
                    ) : (
                      <ServiceIcon />
                    )}
                  </div>

                  <div className="product-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(product)
                      }
                      aria-label={`Edit ${product.name}`}
                    >
                      <EditIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(product)
                      }
                      aria-label={
                        product.active
                          ? `Deactivate ${product.name}`
                          : `Activate ${product.name}`
                      }
                    >
                      {product.active ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon />
                      )}
                    </button>
                  </div>
                </div>

                <div className="product-card-body">
                  <div className="product-title-row">
                    <h2>{product.name}</h2>

                    <span
                      className={
                        product.active
                          ? 'product-status active'
                          : 'product-status'
                      }
                    >
                      {product.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <p className="product-description">
                    {product.description ||
                      'No description added.'}
                  </p>

                  <div className="product-meta">
                    <span>
                      {product.item_type ===
                      'product'
                        ? 'Product'
                        : 'Service'}
                    </span>

                    <span>
                      Unit: {product.unit}
                    </span>

                    {product.sku && (
                      <span>
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                </div>

                <div className="product-card-footer">
                  <div>
                    <small>Selling price</small>
                    <strong>
                      {formatMoney(
                        Number(
                          product.selling_price
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>Cost price</small>
                    <strong>
                      {formatMoney(
                        Number(
                          product.cost_price
                        )
                      )}
                    </strong>
                  </div>

                  <span
                    className={
                      product.track_inventory
                        ? 'inventory-badge tracked'
                        : 'inventory-badge'
                    }
                  >
                    {product.track_inventory
                      ? 'Inventory tracked'
                      : 'No inventory'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="products-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="products-modal-header">
              <div>
                <span className="products-eyebrow">
                  {editingProduct
                    ? 'EDIT ITEM'
                    : 'NEW ITEM'}
                </span>

                <h2 id="product-modal-title">
                  {editingProduct
                    ? 'Update catalog item'
                    : 'Add product or service'}
                </h2>
              </div>

              <button
                type="button"
                className="products-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              className="products-form"
              onSubmit={handleSubmit}
            >
              <div className="products-form-grid">
                <label>
                  <span>Name *</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="e.g. 5kW Solar Installation"
                    required
                  />
                </label>

                <label>
                  <span>Type *</span>
                  <select
                    value={form.item_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        item_type:
                          event.target.value as
                            | 'product'
                            | 'service',
                        track_inventory:
                          event.target.value ===
                          'product'
                            ? form.track_inventory
                            : false,
                      })
                    }
                  >
                    <option value="product">
                      Product
                    </option>
                    <option value="service">
                      Service
                    </option>
                  </select>
                </label>

                <label>
                  <span>Selling price *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        selling_price:
                          event.target.value,
                      })
                    }
                    placeholder="0.00"
                    required
                  />
                </label>

                <label>
                  <span>Cost price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        cost_price:
                          event.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </label>

                <label>
                  <span>Unit</span>
                  <input
                    value={form.unit}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        unit: event.target.value,
                      })
                    }
                    placeholder="unit, piece, hour, kg..."
                  />
                </label>

                <label>
                  <span>SKU</span>
                  <input
                    value={form.sku}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sku: event.target.value,
                      })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Briefly describe this product or service..."
                  rows={3}
                />
              </label>

              {form.item_type === 'product' && (
                <label className="products-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      form.track_inventory
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        track_inventory:
                          event.target.checked,
                      })
                    }
                  />

                  <span>
                    <strong>
                      Track inventory
                    </strong>
                    <small>
                      Let Gideon track stock
                      movement for this product.
                    </small>
                  </span>
                </label>
              )}

              {error && (
                <div className="products-form-error">
                  {error}
                </div>
              )}

              <div className="products-modal-footer">
                <button
                  type="button"
                  className="products-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save changes'
                      : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="products-stat">
      <div className="products-stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PlusIcon({ size = 18 }: IconProps) {
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
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
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

function BoxIcon({ size = 20 }: IconProps) {
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
        d="m4 7.5 8 4.5 8-4.5M12 12v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InventoryIcon({
  size = 20,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5h14v14H5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 9h8M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ServiceIcon({ size = 20 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-3 3-3-1-1-3 3-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 20 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon({ size = 17 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m14 6 4 4M5 19l3.5-.8L18.5 8.2a2.1 2.1 0 0 0-3-3L5.5 15.2 5 19Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon({ size = 17 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 5v14M16 5v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon({ size = 17 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 9 6-9 6V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ size = 19 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type IconProps = {
  size?: number;
};
