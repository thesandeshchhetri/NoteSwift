import { AppLayout as MainAppLayout } from '@/components/AppLayout';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainAppLayout sidebarContent={<AdminSidebar />}>{children}</MainAppLayout>;
}
