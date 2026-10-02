import AdminNav from '@/components/admin/AdminNav';
import AdminSessionGuard from '@/components/admin/AdminSessionGuard';
import './admin.css';

/**
 * Sin `force-dynamic` ni `revalidate`: en la demo no hay nada que leer en el
 * servidor. El guard envuelve todo el panel: no se dibuja hasta saber el rol.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionGuard>
      <div className="admin-shell">
        <AdminNav />
        <main className="admin-content">{children}</main>
      </div>
    </AdminSessionGuard>
  );
}
