import LoginForm from '@/components/LoginForm';

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionExpired = params.reason === 'session';

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="brand-mark">IQ</div>
        <div>
          <h1>Inventory QAS</h1>
          <p>
            Plataforma de inventario empresarial con seguridad Keycloak, dashboard operativo y
            auditor&iacute;a Envers para el Plan de implementaci&oacute;n v3.0.
          </p>
        </div>
      </aside>
      <div className="login-panel">
        <LoginForm sessionExpired={sessionExpired} />
      </div>
    </div>
  );
}
