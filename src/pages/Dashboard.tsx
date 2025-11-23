
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@recurly/react-recurly';
import type { Plan, Subscription } from '../types/subscription';
import { subscriptionService } from '../services/subscriptionService';
import SubscribeForm from '../components/SubscribeForm';
import SubscriptionDetails from '../components/SubscriptionDetails';
import UpdatePlanForm from '../components/UpdatePlanForm';

export default function Dashboard() {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSubscribeForm, setShowSubscribeForm] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        initializeDashboard();
    }, [token, navigate]);

    const initializeDashboard = async () => {
        try {
            const [subscriptionData, plansData] = await Promise.all([
                subscriptionService.getSubscriptions(),
                subscriptionService.getPlans()
            ]);
            setSubscription(subscriptionData);
            setPlans(plansData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleSubscribeSuccess = async () => {
        const data = await subscriptionService.getSubscriptions();
        setSubscription(data);
        setShowSubscribeForm(false);
    };

    const handleUpdateSubmit = async (planCode: string) => {
        if (!subscription) return;

        try {
            const data = await subscriptionService.updateSubscription(subscription.id, planCode);
            setSubscription({ ...subscription, plan_code: data.newPlan });
            setIsUpdating(false);
            alert('Plan updated successfully!');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCancel = async () => {
        if (!subscription) return;
        if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

        try {
            await subscriptionService.cancelSubscription(subscription.id);
            setSubscription(null);
            alert('Subscription canceled.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="app-container">Loading...</div>;

    return (
        <div>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1>Member Dashboard</h1>
                <button onClick={handleLogout} className="secondary">Log Out</button>
            </header>

            {error && (
                <div style={{
                    color: 'red',
                    padding: '1rem',
                    border: '1px solid red',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {!subscription && !showSubscribeForm && (
                <div className="card">
                    <h2>No Active Subscription</h2>
                    <p>You are not currently subscribed to any plan.</p>
                    <button onClick={() => setShowSubscribeForm(true)}>Add Subscription</button>
                </div>
            )}

            {!subscription && showSubscribeForm && (
                <Elements>
                    <SubscribeForm
                        plans={plans}
                        onSuccess={handleSubscribeSuccess}
                        onCancel={() => setShowSubscribeForm(false)}
                    />
                </Elements>
            )}

            {subscription && (
                <div className="card">
                    {isUpdating ? (
                        <UpdatePlanForm
                            plans={plans}
                            currentPlanCode={subscription.plan.code}
                            onSubmit={handleUpdateSubmit}
                            onCancel={() => setIsUpdating(false)}
                        />
                    ) : (
                        <SubscriptionDetails
                            subscription={subscription}
                            plans={plans}
                            onUpdate={() => setIsUpdating(true)}
                            onCancel={handleCancel}
                        />
                    )}
                </div>
            )}
        </div>
    );
}