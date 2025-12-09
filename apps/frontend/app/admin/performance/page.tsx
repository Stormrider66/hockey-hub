import { Metadata } from 'next';
import PerformanceDashboard from '@/components/admin/PerformanceDashboard';

export const metadata: Metadata = {
  title: 'Performance Dashboard | Hockey Hub',
  description: 'Monitor application performance metrics and web vitals',
};

export default function PerformancePage() {
  return <PerformanceDashboard />;
}