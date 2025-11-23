import { Link } from 'react-router-dom';
import type {Plan, Subscription} from '../types/subscription';

interface SubscriptionDetailsProps {
    subscription: Subscription;
    plans: Plan[];
    onUpdate: () => void;
    onCancel: () => void;
}

export default function SubscriptionDetails({
                                                subscription,
                                                plans,
                                                onUpdate,
                                                onCancel
                                            }: SubscriptionDetailsProps) {
    const getPlanDisplay = (planCode: string) => {
        const p = plans.find(pl => pl.code === planCode);
        return p ? `${p.name} - $${p.cost} / ${p.intervalLength} ${p.interval}` : planCode;
    };

    return (
        <div className="card">
            <h2>Active Subscription</h2>
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <p><strong>Plan:</strong> {getPlanDisplay(subscription.plan.code)}</p>
                <p><strong>Status:</strong> {subscription.state}</p>
                <p><strong>Renews/Ends:</strong> {new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}</p>
            </div>

            <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/plan-details">
                    <button className="secondary">Details</button>
                </Link>
                <button onClick={onUpdate}>Update</button>
                <button onClick={onCancel} style={{ backgroundColor: '#ff4444' }}>
                    Cancel Subscription
                </button>
            </nav>
        </div>
    );
}