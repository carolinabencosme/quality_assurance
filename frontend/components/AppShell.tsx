import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-body">
        <Topbar />
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}
