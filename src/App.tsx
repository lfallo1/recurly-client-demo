import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecurlyProvider } from '@recurly/react-recurly';
import './App.css';

// Pages
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlanDetails from './pages/PlanDetails';

function App() {
    return (
        <RecurlyProvider publicKey="ewr1-uN04Rox9K1Ld1D2qLk29A6">
            <BrowserRouter>
                <div className="app-container">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/login" element={<Login />} />

                        {/* Member Routes (Protected logic can be added later) */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/plan-details" element={<PlanDetails />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </RecurlyProvider>
    );
}

export default App;