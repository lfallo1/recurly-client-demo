import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div>
            <h1>Welcome to the Demo</h1>
            <p>This is the public landing page.</p>
            <nav>
                <Link to="/login">Log In</Link> | <Link to="/signup">Sign Up</Link>
            </nav>
        </div>
    );
}