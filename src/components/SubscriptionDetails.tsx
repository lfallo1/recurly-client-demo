import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Plan, Subscription } from '../types/subscription';
import UpdatePlanForm from './UpdatePlanForm';

interface SubscriptionDetailsProps {
    subscriptions: Subscription[];
    plans: Plan[];
    onUpdate: (subscriptionId: string, planCode: string) => void;
    onCancel: (subscriptionId: string) => void;
}

export default function SubscriptionDetails({
                                                subscriptions,
                                                plans,
                                                onUpdate,
                                                onCancel
                                            }: SubscriptionDetailsProps) {
    const [updatingSubscriptionId, setUpdatingSubscriptionId] = useState<string | null>(null);

    const getPlanDisplay = (planCode: string) => {
        const p = plans.find(pl => pl.code === planCode);
        return p ? `${p.name} - $${p.cost} / ${p.intervalLength} ${p.interval}` : planCode;
    };

    const handleUpdateSubmit = (planCode: string) => {
        if (updatingSubscriptionId) {
            onUpdate(updatingSubscriptionId, planCode);
            setUpdatingSubscriptionId(null);
        }
    };

    return (
        <>
            {subscriptions.map(subscription => (
                <div key={subscription.id} className="card">
                    {updatingSubscriptionId === subscription.id ? (
                        <UpdatePlanForm
                            plans={plans}
                            currentPlanCode={subscription.plan.code}
                            onSubmit={handleUpdateSubmit}
                            onCancel={() => setUpdatingSubscriptionId(null)}
                        />
                    ) : (
                        <>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <p><strong>Plan:</strong> {getPlanDisplay(subscription.plan.code)}</p>
                                <p><strong>Status:</strong> {subscription.state}</p>
                                <p><strong>Renews/Ends:</strong> {new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}</p>
                            </div>

                            <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <Link to="/plan-details">
                                    <button className="secondary">Details</button>
                                </Link>
                                <button onClick={() => setUpdatingSubscriptionId(subscription.id)}>
                                    Update
                                </button>
                                <button onClick={() => onCancel(subscription.id)} style={{ backgroundColor: '#ff4444' }}>
                                    Cancel Subscription
                                </button>
                            </nav>
                        </>
                    )}
                </div>
            ))}
        </>
    );
}