import { Link } from 'react-router-dom';

export default function PlanDetails() {
  return (
    <div>
      <h1>Plan Details</h1>
      <p>Here is the information about your current subscription.</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}
