import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </AdminAuthGuard>
  );
}