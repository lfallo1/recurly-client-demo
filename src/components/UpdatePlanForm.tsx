import { useState } from 'react';
import type { Plan } from '../types/subscription';

interface UpdatePlanFormProps {
    plans: Plan[];
    currentPlanCode: string;
    onSubmit: (planCode: string) => void;
    onCancel: () => void;
}

export default function UpdatePlanForm({
                                           plans,
                                           currentPlanCode,
                                           onSubmit,
                                           onCancel
                                       }: UpdatePlanFormProps) {
    const [selectedPlan, setSelectedPlan] = useState(currentPlanCode);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(selectedPlan);
    };

    return (
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <h3>Update Plan</h3>
            <select
                value={selectedPlan}
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
            <button
                type="button"
                onClick={onCancel}
                style={{ marginLeft: '0.5rem' }}
                className="secondary"
            >
                Cancel
            </button>
        </form>
    );
}