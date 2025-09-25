import { AdminLoginPage } from '@/components/admin/admin-login-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - DentiStar',
  description: 'Administrative login for DentiStar Guide',
};

export default function AdminLogin() {
  return <AdminLoginPage />;
}