import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const data = await response.json();

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to log in');
        }
    };

    return (
        <div>
            <h1>Log In</h1>
            <p>Enter your credentials.</p>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleLogin} style={{ maxWidth: '300px' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <button type="submit">Log In</button>
            </form>

            <p style={{ marginTop: '2rem' }}>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
            <p>
                <Link to="/">Back to Home</Link>
            </p>
        </div>
    );
}