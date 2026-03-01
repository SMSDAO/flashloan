import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';
import WalletLogin from '../components/WalletLogin';

const widgets = [
  <div>Profile Widget</div>,
  <div>Scoring Widget</div>,
  <div>Analysis Widget</div>,
  <div>Flashloan History Widget</div>
];

export default function Profile() {
  return (
    <CoreDashboardLayout title="User Profile" widgets={widgets} chat={<span>Profile Chat Placeholder</span>}>
      <WalletLogin />
      {/* Add scoring, analysis, and flashloan history here */}
    </CoreDashboardLayout>
  );
}
