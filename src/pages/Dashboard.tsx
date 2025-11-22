import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

declare global {
    interface Window {
        recurly: any;
    }
}

interface Plan {
    code: string;
    name: string;
    interval: string;
    intervalLength: number;
    cost: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<any | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI States
    const [showSubscribeForm, setShowSubscribeForm] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);


    // Form States
    const [selectedPlan, setSelectedPlan] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const recurlyContainerRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        const init = async () => {
            try {
                await Promise.all([fetchSubscription(), fetchPlans()]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [token, navigate]);

    useEffect(() => {
        if (showSubscribeForm && recurlyContainerRef.current) {
            const recurly = window.recurly;
            recurly.configure('ewr1-uN04Rox9K1Ld1D2qLk29A6');

            const elements = recurly.Elements();
            const cardElement = elements.CardElement();

            // Store both the cardElement AND elements instance for later use
            recurlyContainerRef.current.dataset.cardElement = 'initialized';
            (recurlyContainerRef.current as any).__cardElement = cardElement;
            (recurlyContainerRef.current as any).__elements = elements;

            try {
                cardElement.attach(recurlyContainerRef.current);
            } catch (e) {
                console.error("Recurly attach error", e);
            }

            return () => {
                if(recurlyContainerRef.current) {
                    recurlyContainerRef.current.innerHTML = '';
                    delete (recurlyContainerRef.current as any).__cardElement;
                    delete (recurlyContainerRef.current as any).__elements;
                }
            };
        }
    }, [showSubscribeForm]);

    const fetchPlans = async () => {
        try {
            const res = await fetch('http://localhost:3000/plans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
                if (data.length > 0) setSelectedPlan(data[0].code);
            }
        } catch (e) {
            console.error("Failed to load plans", e);
        }
    };

    const fetchSubscription = async () => {
        try {
            const res = await fetch('http://localhost:3000/subscriptions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch subscriptions');
            const data = await res.json();
            setSubscription(data);
        } catch (err: any) {
            throw err;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };


    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const recurly = window.recurly;
        const elements = (recurlyContainerRef.current as any)?.__elements;

        if (!elements) {
            setError('Payment form not initialized');
            return;
        }

        const billingData = {
            first_name: firstName,
            last_name: lastName,
            address1: address1,
            city: city,
            state: state,
            country: country,
            postal_code: postalCode
        };

        recurly.token(elements, billingData, async (err: any, token: any) => {
            if (err) {
                setError(err.message || 'Failed to tokenize payment information');
                return;
            }

            try {
                const res = await fetch('http://localhost:3000/subscribe', {

                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        planCode: selectedPlan,
                        token: token.id
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Subscription failed');
                }

                await fetchSubscription(); // Refresh state
                setShowSubscribeForm(false);
            } catch (reqErr: any) {
                setError(reqErr.message || 'An error occurred during subscription');
            }
        });
    };

    const handleCancel = async () => {
        if (!subscription) return;
        if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

        try {
            const res = await fetch(`http://localhost:3000/subscriptions/${subscription.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Cancellation failed');

            setSubscription(null);
            alert('Subscription canceled.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscription) return;

        try {
            const res = await fetch(`http://localhost:3000/subscriptions/${subscription.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planCode: selectedPlan })
            });
            if (!res.ok) throw new Error('Update failed');

            const data = await res.json();
            setSubscription({ ...subscription, plan_code: data.newPlan });
            setIsUpdating(false);
            alert('Plan updated successfully!');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getPlanDisplay = (planCode: string) => {
        const p = plans.find(pl => pl.code === planCode);
        return p ? `${p.name} - $${p.cost} / ${p.intervalLength} ${p.interval}` : planCode;
    };

    if (loading) return <div className="app-container">Loading...</div>;

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Member Dashboard</h1>
                <button onClick={handleLogout} className="secondary">Log Out</button>
            </header>

            {error && <div style={{ color: 'red', padding: '1rem', border: '1px solid red', marginBottom: '1rem' }}>{error}</div>}

            {/* No active subscription */}
            {!subscription && !showSubscribeForm && (
                <div className="card">
                    <h2>No Active Subscription</h2>
                    <p>You are not currently subscribed to any plan.</p>
                    <button onClick={() => setShowSubscribeForm(true)}>Add Subscription</button>
                </div>
            )}


            {/* Subscribe form */}
            {!subscription && showSubscribeForm && (
                <div className="card">
                    <h2>Subscribe</h2>
                    <form onSubmit={handleSubscribe}>
                        <div style={{marginBottom: '1rem', textAlign: 'left'}}>
                            <label>Select Plan</label>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}}
                            >
                                {plans.map(p => (
                                    <option key={p.code} value={p.code}>
                                        {p.name} — ${p.cost} every {p.intervalLength} {p.interval}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Name Fields */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1rem',
                            textAlign: 'left'
                        }}>
                            <div>
                                <label>First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Address Fields */}
                        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                            <label>Address</label>
                            <input
                                type="text"
                                value={address1}
                                onChange={(e) => setAddress1(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginTop: '0.5rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1rem',
                            textAlign: 'left'
                        }}>
                            <div>
                                <label>City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label>State</label>
                                <input
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label>Postal Code</label>
                                <input
                                    type="text"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                            <label>Country</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                required
                                placeholder="e.g., US"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginTop: '0.5rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Recurly Card Element Container */}
                        <div style={{marginBottom: '1rem', textAlign: 'left'}}>
                            <label>Credit Card</label>
                            <div
                                ref={recurlyContainerRef}
                                style={{
                                    border: '1px solid #ccc',
                                    padding: '10px',
                                    marginTop: '0.5rem',
                                    borderRadius: '4px',
                                    minHeight: '40px'
                                }}
                            />
                        </div>

                        <input type="hidden" data-recurly="token" name="recurly-token"/>

                        <div style={{display: 'flex', gap: '1rem'}}>
                            <button type="submit">Subscribe Now</button>
                            <button type="button" onClick={() => setShowSubscribeForm(false)}
                                    className="secondary">Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Active subscription */}
            {subscription && (
                <div className="card">
                    <h2>Active Subscription</h2>
                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <p><strong>Plan:</strong> {getPlanDisplay(subscription.plan.code)}</p>
                        <p><strong>Status:</strong> {subscription.state}</p>
                        <p><strong>Renews/Ends:</strong> {new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}</p>
                    </div>

                    {isUpdating ? (
                        <form onSubmit={handleUpdate} style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <h3>Update Plan</h3>
                            <select
                                value={selectedPlan || subscription.plan.code}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                style={{ padding: '0.5rem', marginRight: '1rem' }}
                            >
                                {plans.map(p => (
                                    <option key={p.code} value={p.code}>
                                        {p.name} — ${p.cost}
                                    </option>
                                ))}
                            </select>
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setIsUpdating(false)} style={{ marginLeft: '0.5rem' }} className="secondary">Cancel</button>
                        </form>
                    ) : (
                        <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link to="/plan-details">
                                <button className="secondary">Details</button>
                            </Link>
                            <button onClick={() => {
                                setSelectedPlan(subscription.plan_code);
                                setIsUpdating(true);
                            }}>Update</button>
                            <button onClick={handleCancel} style={{ backgroundColor: '#ff4444' }}>Cancel Subscription</button>
                        </nav>
                    )}
                </div>
            )}
        </div>
    );
}