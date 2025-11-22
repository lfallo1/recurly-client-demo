import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullname || !email || !password) {
            setError('All fields are required');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password }),
            });

            if (!response.ok) {
                throw new Error('Signup failed');
            }

            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>
            <p>Create your account here.</p>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSignup} style={{ maxWidth: '300px' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                    <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

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

                <button type="submit">Sign Up</button>
            </form>

            <p style={{ marginTop: '2rem' }}>
                <Link to="/">Back to Home</Link>
            </p>
        </div>
    );
}