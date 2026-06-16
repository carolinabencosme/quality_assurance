import DockNav from '@/components/DockNav';
import Topbar from '@/components/Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas">
      <div className="app-grid-bg" aria-hidden />
      <div className="app-blob app-blob--1" aria-hidden />
      <div className="app-blob app-blob--2" aria-hidden />
      <div className="app-frame">
        <Topbar />
        <main className="main-area">{children}</main>
        <DockNav />
      </div>
    </div>
  );
}
