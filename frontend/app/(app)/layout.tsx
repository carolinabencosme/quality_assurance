import AppShell from '@/components/AppShell';
import SessionGuard from '@/components/SessionGuard';

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
