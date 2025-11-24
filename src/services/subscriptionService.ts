const API_BASE = 'http://localhost:3000';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const subscriptionService = {
    async getPlans() {
        const res = await fetch(`${API_BASE}/plans`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch plans');
        return res.json();
    },

    async getSubscriptions() {
        const res = await fetch(`${API_BASE}/subscriptions`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch subscriptions');
        return res.json();
    },

    async createSubscription(planCode: string, token: string) {
        const res = await fetch(`${API_BASE}/subscribe`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ planCode, token })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Subscription failed');
        }
        return res.json();
    },

    async updateSubscription(subscriptionId: string, planCode: string) {
        const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ planCode })
        });
        if (!res.ok) throw new Error('Update failed');
        return res.json();
    },

    async cancelSubscription(subscriptionId: string) {
        const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Cancellation failed');
        return res.json();
    }
};