# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

```js
//server.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { dbRun, dbGet, dbAll } = require('./dbutils');
const recurly = require('recurly'); // npm package
const client = new recurly.Client('52f5042e5dc042d5aae9b4c4ab845389');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super-secret-dev-key'; // Keep simple for playground

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Middleware: Authenticate Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Routes ---

// 1. Signup
app.post('/signup', async (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).send('Missing fields');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun(
            'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
            [fullname, email, hashedPassword]
        );
        res.status(201).send({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 2. Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).send('User not found');
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ token, user: { id: user.id, fullname: user.fullname, email: user.email } });
        } else {
            res.status(403).send('Not Allowed');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 3. Subscribe (Protected)
app.post('/subscribe', authenticateToken, async (req, res) => {
    const { planCode, token } = req.body;
    const userId = req.user.id;

    try {
        const purchaseReq = {
            subscriptions: [{ planCode: planCode }],
            currency: 'USD',
            account: {
                code: `user_${userId}`,
                billingInfo: {
                    tokenId: token
                }
            }
        };

        const purchase = await client.createPurchase(purchaseReq);
        const subscription = purchase.subscriptions[0]; // Get first subscription from purchase

        if (subscription.state === 'active') {
            console.log(`User ${userId} subscribed to plan ${planCode} successfully!`);

            try {
                const result = await dbRun(
                    `INSERT INTO subscriptions (user_id, subscription_id, plan_code, status, current_period_ends_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [userId, subscription.id, planCode, subscription.state, subscription.currentPeriodEndsAt]
                );

                res.status(201).json({
                    subscriptionId: result.lastID,
                    recurlySubscriptionId: subscription.id,
                    planCode,
                    status: subscription.state
                });
            } catch (err) {
                res.status(500).send(err.message);
            }
        }
    } catch (err) {
        // Handle 3D Secure if needed
        if (err && err.transactionError && err.transactionError.code === 'three_d_secure_action_required') {
            return res.status(400).json({
                error: 'three_d_secure_required',
                actionTokenId: err.transactionError.threeDSecureActionTokenId
            });
        }

        console.log(err);
        return res.status(500).send(err.message);
    }
});

// 4. List Subscriptions (Protected)
app.get('/subscriptions', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const subs = await dbAll('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
        res.json(subs);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 5. Update Subscription (Protected)
app.put('/subscriptions/:id', authenticateToken, async (req, res) => {
    const subId = req.params.id;
    const userId = req.user.id;
    const { planCode } = req.body; // Assuming we are just upgrading/downgrading plan

    try {
        // Verify ownership
        const sub = await dbGet('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [subId, userId]);
        if (!sub) return res.status(404).send('Subscription not found');

        await dbRun('UPDATE subscriptions SET plan_code = ? WHERE id = ?', [planCode, subId]);
        res.json({ message: 'Subscription updated', id: subId, newPlan: planCode });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 6. Cancel Subscription (Protected)
app.delete('/subscriptions/:id', authenticateToken, async (req, res) => {
    const subId = req.params.id;
    const userId = req.user.id;

    try {
        // Verify ownership
        const sub = await dbGet('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [subId, userId]);
        if (!sub) return res.status(404).send('Subscription not found');

        // In a real app, we might not delete, but set status to 'canceled' or 'expired'
        await dbRun('UPDATE subscriptions SET status = ? WHERE id = ?', ['canceled', subId]);
        res.json({ message: 'Subscription canceled', id: subId });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/plans', async (req, res) => {
    try {
        const pager = client.listPlans({ params: { limit: 200 } })
        const plans = [];
        for await (const plan of pager.each()) {
            console.log(plan.code)
            plans.push({
                code: plan.code,
                name: plan.name,
                interval: plan.intervalUnit,           // e.g., 'months'
                intervalLength: plan.intervalLength,   // e.g., 1
                cost: plan.currencies.find(c => c.currency === 'USD')?.unitAmount || 0
            });
        }
        res.json(plans);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 7. Webhooks (Public/Unprotected - normally protected by signature verification)
app.post('/webhooks', (req, res) => {
    const event = req.body;

    console.log('Received Webhook:', JSON.stringify(event, null, 2));

    // logic to handle 'new_subscription_notification', 'billing_info_updated', etc.

    res.sendStatus(200); // Acknowledge receipt
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

```