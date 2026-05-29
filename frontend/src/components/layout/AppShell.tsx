import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">Inventory QAS</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestion de Inventarios — Fase 0 (Setup)
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          Keycloak: {import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8081'} — Realm:{' '}
          {import.meta.env.VITE_KEYCLOAK_REALM ?? 'inventory-realm'}
        </p>
      </footer>
    </div>
  );
}
