import { useState } from 'react';
import { CardElement, useRecurly } from '@recurly/react-recurly';
import type { Plan } from '../types/subscription';
import { subscriptionService } from '../services/subscriptionService';

interface SubscribeFormProps {
    plans: Plan[];
    onSuccess: () => void;
    onCancel: () => void;
}

export default function SubscribeForm({ plans, onSuccess, onCancel }: SubscribeFormProps) {
    const recurly = useRecurly();
    const [selectedPlan, setSelectedPlan] = useState(plans[0]?.code || '');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!recurly) {
            setError('Recurly not initialized');
            setIsSubmitting(false);
            return;
        }

        const billingData = {
            first_name: firstName,
            last_name: lastName,
            address1,
            city,
            state,
            country,
            postal_code: postalCode
        };

        recurly.token(billingData, async (err: any, token: any) => {
            if (err) {
                setError(err.message || 'Failed to tokenize payment information');
                setIsSubmitting(false);
                return;
            }

            try {
                await subscriptionService.createSubscription(selectedPlan, token.id);
                onSuccess();
            } catch (reqErr: any) {
                setError(reqErr.message || 'An error occurred during subscription');
            } finally {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <div className="card">
            <h2>Subscribe</h2>
            {error && (
                <div style={{ color: 'red', padding: '1rem', border: '1px solid red', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label>Select Plan</label>
                    <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    >
                        {plans.map(p => (
                            <option key={p.code} value={p.code}>
                                {p.name} — ${p.cost} every {p.intervalLength} {p.interval}
                            </option>
                        ))}
                    </select>
                </div>

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
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label>Address</label>
                    <input
                        type="text"
                        value={address1}
                        onChange={(e) => setAddress1(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
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
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label>State</label>
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label>Postal Code</label>
                    <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label>Country</label>
                    <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        placeholder="e.g., US"
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label>Credit Card</label>
                    <div
                        style={{
                            border: '1px solid #ccc',
                            padding: '10px',
                            marginTop: '0.5rem',
                            borderRadius: '4px',
                            minHeight: '40px'
                        }}
                    >
                        <CardElement />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Subscribe Now'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="secondary"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}