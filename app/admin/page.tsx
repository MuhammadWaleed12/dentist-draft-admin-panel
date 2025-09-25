import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - DentiStar',
  description: 'Administrative dashboard for DentiStar Guide',
};

export default function AdminPage() {
  return <AdminDashboard />;
}