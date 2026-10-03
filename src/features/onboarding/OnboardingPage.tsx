import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { errorMessage, getCurrentContext } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

type BusinessModel = 'services' | 'products' | 'projects' | 'mixed' | '';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const steps = [
  'Welcome',
  'Business',
  'Customers',
  'Focus',
  'Records',
  'Review',
];

const businessModels: {
  value: BusinessModel;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'services',
    title: 'Services',
    description: 'I sell expertise, labour or professional services.',
    icon: '✦',
  },
  {
    value: 'products',
    title: 'Products',
    description: 'I sell physical products or goods.',
    icon: '▣',
  },
  {
    value: 'projects',
    title: 'Projects',
    description: 'I manage jobs, installations or projects.',
    icon: '⌁',
  },
  {
    value: 'mixed',
    title: 'Products + Services',
    description: 'My business combines both.',
    icon: '◆',
  },
];

const customerTypes = [
  'Individuals',
  'Businesses',
  'Contractors',
  'Government',
  'Mixed',
];

const focusOptions = [
  {
    id: 'customers',
    title: 'Customers',
    description: 'Keep customer relationships organized.',
    icon: '◎',
  },
  {
    id: 'leads',
    title: 'Leads',
    description: 'Track opportunities and follow-ups.',
    icon: '◌',
  },
  {
    id: 'conversations',
    title: 'Conversations',
    description: 'Keep enquiries and customer communication organized.',
    icon: '◫',
  },
  {
    id: 'money',
    title: 'Money',
    description: 'Understand sales, expenses and profitability.',
    icon: '₦',
  },
  {
    id: 'stock',
    title: 'Stock',
    description: 'Keep an eye on materials and inventory.',
    icon: '▤',
  },
  {
    id: 'performance',
    title: 'Performance',
    description: 'Understand how the business is performing.',
    icon: '↗',
  },
];

const recordOptions = [
  {
    id: 'excel',
    title: 'Excel / CSV',
    description: 'Sales, expenses, customers, inventory and more.',
    icon: '▦',
  },
  {
    id: 'documents',
    title: 'PDFs / Documents',
    description: 'Price lists, invoices, policies and business documents.',
    icon: '▱',
  },
  {
    id: 'receipts',
    title: 'Receipts / Images',
    description: 'Records currently stored as photos.',
    icon: '▧',
  },
  {
    id: 'nothing',
    title: 'Nothing organized yet',
    description: 'That is completely fine. We can start from here.',
    icon: '○',
  },
];

export function OnboardingPage() {
  const { session, loading } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const [businessModel, setBusinessModel] =
    useState<BusinessModel>('');

  const [customerType, setCustomerType] = useState('');
  const [journey, setJourney] = useState<string[]>([
    'Enquiry',
    'Quote',
    'Payment',
    'Delivery / Job',
    'Follow-up',
  ]);

  const [focus, setFocus] = useState<string[]>([
    'leads',
    'conversations',
  ]);

  const [records, setRecords] = useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (session) {
      getCurrentContext()
        .then((context) => {
          if (context?.profile) {
            nav('/dashboard', { replace: true });
          }
        })
        .catch(() => {});
    }
  }, [session, nav]);

  if (loading) {
    return (
      <main className="center">
        <div className="loader" />
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  function next() {
    setDirection('forward');
    setError('');

    if (step < 6) {
      setStep((value) => (value + 1) as Step);
    }
  }

  function back() {
    setDirection('back');
    setError('');

    if (step > 1) {
      setStep((value) => (value - 1) as Step);
    }
  }

  function toggleArrayValue(
    value: string,
    setter: Dispatch<SetStateAction<string[]>>
  ) {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function toggleJourney(value: string) {
    setJourney((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();

    setBusy(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc(
        'create_business_for_current_user',
        {
          p_name: name.trim(),
          p_business_type: industry.trim() || null,
          p_phone: phone.trim() || null,
          p_location: null,
          p_description: description.trim() || null,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setCreated(true);
    } catch (err) {
      const message = errorMessage(err);

      setError(
        message.includes('already')
          ? 'This account already has a business. Please continue to the dashboard.'
          : message
      );
    } finally {
      setBusy(false);
    }
  }

  function renderStep() {
    if (created) {
      return (
        <div className="onboarding-success onboarding-step-enter">
          <div className="success-orb">
            <span>✓</span>
          </div>

          <span className="eyebrow">WORKSPACE READY</span>

          <h1>Your business is ready.</h1>

          <p className="onboarding-lead">
            Gideon now has the foundation it needs to help you
            organize your business.
          </p>

          <div className="success-actions">
            <button
              className="primary onboarding-main-action"
              onClick={() => nav('/dashboard', { replace: true })}
            >
              Open my dashboard
              <span>→</span>
            </button>

            <button
              className="secondary"
              onClick={() => nav('/knowledge')}
            >
              Add business knowledge
            </button>

            <button
              className="ghost"
              onClick={() => nav('/leads')}
            >
              Create my first lead
            </button>
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <div className="gideon-mark-large">
              <span>G</span>
            </div>

            <span className="eyebrow">WELCOME TO GIDEON</span>

            <h1>
              Let's build your
              <br />
              business workspace.
            </h1>

            <p className="onboarding-lead">
              Gideon helps you bring customers, conversations,
              leads, business knowledge and eventually your numbers
              into one operating workspace.
            </p>

            <div className="onboarding-preview">
              <div className="preview-line">
                <span>Customer</span>
                <i>→</i>
                <span>Lead</span>
                <i>→</i>
                <span>Job</span>
              </div>

              <div className="preview-line secondary-line">
                <span>Sales</span>
                <i>→</i>
                <span>Records</span>
                <i>→</i>
                <span>Insights</span>
              </div>
            </div>

            <button
              className="primary onboarding-main-action"
              onClick={next}
            >
              Set up my business
              <span>→</span>
            </button>

            <small className="onboarding-note">
              Takes about 2–3 minutes. You can change details later.
            </small>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <span className="eyebrow">YOUR BUSINESS</span>

            <h1>What kind of business are you running?</h1>

            <p className="onboarding-lead">
              This helps Gideon understand how your workspace
              should think about the business.
            </p>

            <div className="choice-grid">
              {businessModels.map((model) => (
                <button
                  type="button"
                  key={model.value}
                  className={`choice-card ${
                    businessModel === model.value ? 'selected' : ''
                  }`}
                  onClick={() => setBusinessModel(model.value)}
                >
                  <span className="choice-icon">{model.icon}</span>

                  <span className="choice-copy">
                    <strong>{model.title}</strong>
                    <small>{model.description}</small>
                  </span>

                  <span className="choice-check">
                    {businessModel === model.value ? '✓' : ''}
                  </span>
                </button>
              ))}
            </div>

            <div className="onboarding-fields">
              <label>
                Business name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="organization"
                  placeholder="e.g. Northstar Solar"
                />
              </label>

              <label>
                What does the business do?
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Solar installation and maintenance"
                />
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <span className="eyebrow">YOUR CUSTOMERS</span>

            <h1>Who do you mainly serve?</h1>

            <p className="onboarding-lead">
              Gideon will use this context when helping you organize
              customer relationships and opportunities.
            </p>

            <div className="pill-grid">
              {customerTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`selection-pill ${
                    customerType === type ? 'selected' : ''
                  }`}
                  onClick={() => setCustomerType(type)}
                >
                  <span>
                    {customerType === type ? '✓' : '○'}
                  </span>
                  {type}
                </button>
              ))}
            </div>

            <div className="onboarding-section-label">
              <span>Typical customer journey</span>
              <small>Choose the stages that fit your business.</small>
            </div>

            <div className="journey-list">
              {journey.map((item, index) => (
                <button
                  type="button"
                  key={item}
                  className="journey-item selected"
                  onClick={() => toggleJourney(item)}
                >
                  <span className="journey-number">
                    {index + 1}
                  </span>

                  <strong>{item}</strong>

                  <span className="journey-check">✓</span>
                </button>
              ))}
            </div>

            <label className="onboarding-textarea">
              Short description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the business the way you would explain it to a customer."
              />
            </label>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <span className="eyebrow">YOUR PRIORITIES</span>

            <h1>What should Gideon help you watch?</h1>

            <p className="onboarding-lead">
              Pick the areas that matter most to you. You can
              change this later.
            </p>

            <div className="focus-grid">
              {focusOptions.map((option) => {
                const selected = focus.includes(option.id);

                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`focus-card ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() =>
                      toggleArrayValue(option.id, setFocus)
                    }
                  >
                    <span className="focus-icon">
                      {option.icon}
                    </span>

                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>

                    <span className="focus-check">
                      {selected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="onboarding-tip">
              <span>G</span>
              <p>
                Don't overthink this. Gideon can learn more about
                your business as you use the workspace.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <span className="eyebrow">YOUR RECORDS</span>

            <h1>Where does your business information live?</h1>

            <p className="onboarding-lead">
              This helps us understand how you currently manage
              business information.
            </p>

            <div className="record-list">
              {recordOptions.map((option) => {
                const selected = records.includes(option.id);

                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`record-card ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() =>
                      toggleArrayValue(option.id, setRecords)
                    }
                  >
                    <span className="record-icon">
                      {option.icon}
                    </span>

                    <span className="record-copy">
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>

                    <span className="record-check">
                      {selected ? '✓' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="onboarding-future">
              <span>COMING INTO FOCUS</span>
              <p>
                Later, Gideon will be able to turn business records
                into useful financial and operational insights.
              </p>
            </div>

            <label>
              Business phone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 0803 123 4567"
              />
            </label>
          </div>
        );

      case 6:
        return (
          <div className="onboarding-step onboarding-step-enter">
            <span className="eyebrow">FINAL CHECK</span>

            <h1>Here's what Gideon learned.</h1>

            <p className="onboarding-lead">
              Review the foundation before we create your workspace.
            </p>

            <div className="review-card">
              <div className="review-row">
                <span>Business</span>
                <strong>{name || 'Not provided'}</strong>
              </div>

              <div className="review-row">
                <span>Industry</span>
                <strong>{industry || 'Not provided'}</strong>
              </div>

              <div className="review-row">
                <span>Business model</span>
                <strong>
                  {businessModels.find(
                    (item) => item.value === businessModel
                  )?.title || 'Not selected'}
                </strong>
              </div>

              <div className="review-row">
                <span>Customers</span>
                <strong>{customerType || 'Not selected'}</strong>
              </div>

              <div className="review-block">
                <span>Gideon focus</span>

                <div className="review-tags">
                  {focus.length ? (
                    focus.map((id) => (
                      <span key={id}>
                        {focusOptions.find(
                          (item) => item.id === id
                        )?.title || id}
                      </span>
                    ))
                  ) : (
                    <span>None selected</span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="alert error onboarding-error">
                {error}
              </div>
            )}

            <button
              className="primary onboarding-main-action"
              disabled={busy}
              onClick={() => submit()}
            >
              {busy ? (
                <>
                  <span className="button-spinner" />
                  Building your workspace…
                </>
              ) : (
                <>
                  Create my workspace
                  <span>→</span>
                </>
              )}
            </button>

            <small className="onboarding-note">
              Your workspace will be created using the information
              currently supported by Gideon's business system.
            </small>
          </div>
        );
    }
  }

  return (
    <main className="onboarding-v2">
      <div className="onboarding-shell">
        <header className="onboarding-topbar">
          <div className="onboarding-brand">
            <span className="brand-mark">G</span>
            <div>
              <strong>Gideon Business</strong>
              <small>Business operating workspace</small>
            </div>
          </div>

          {!created && (
            <div className="onboarding-progress-label">
              <span>SETUP</span>
              <strong>
                {String(step).padStart(2, '0')} / 06
              </strong>
            </div>
          )}
        </header>

        {!created && (
          <div className="onboarding-progress">
            <div
              className="onboarding-progress-fill"
              style={{
                width: `${((step - 1) / 5) * 100}%`,
              }}
            />
          </div>
        )}

        <section className="onboarding-main">
          <div className="onboarding-content">
            {renderStep()}
          </div>

          {!created && (
            <footer className="onboarding-footer">
              <button
                type="button"
                className="onboarding-back"
                onClick={back}
                disabled={step === 1 || busy}
              >
                ← Back
              </button>

              {step > 1 && step < 6 && (
                <button
                  type="button"
                  className="primary onboarding-next"
                  onClick={next}
                >
                  Continue
                  <span>→</span>
                </button>
              )}

              {step === 2 && !name.trim() && (
                <span className="onboarding-required">
                  Business name is required
                </span>
              )}
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}
