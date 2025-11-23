export interface Plan {
    code: string;
    name: string;
    interval: string;
    intervalLength: number;
    cost: number;
}

export interface Subscription {
    id: string;
    plan: {
        code: string;
    };
    plan_code?: string;
    state: string;
    currentPeriodEndsAt: string;
}