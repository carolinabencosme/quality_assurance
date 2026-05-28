import Sidebar from '@/components/Sidebar';
import SessionGuard from '@/components/SessionGuard';

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">{children}</div>
      </div>
    </SessionGuard>
  );
}
